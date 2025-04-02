import { useAuth } from '../../AuthProvider.jsx';
import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { useSnackbar } from "notistack";
import { useParams } from 'react-router-dom';

export default function Edit() {
    const { enqueueSnackbar } = useSnackbar();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);

    const auth = useAuth();
    const [isLab, setIsLab] = useState(false);

    const [error, setError] = useState("");
    const rooms = [{ label: "GK301", value: "GK301" }, { label: "GK404", value: "GK404" }, { label: "GK304A", value: "GK304A" }];
    const apiUrl = process.env.REACT_APP_API_URL;

//    const [email, setEmail] = useState("john@dlsu.edu.ph");

    const [selectedRoom, setSelectedRoom] = useState();
    const [today, setToday] = useState(new Date());
    const [days, setDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [times, setTimes] = useState([]);
    const [reservation, setReservation] = useState(null);

    const [selectedTime, setSelectedTime] = useState([]);
    const [selectedSeat, setSelectedSeat] = useState();
    const [isAnonymous, setIsAnonymous] = useState(false);

    const [seats, setSeats] = useState([]);
    const [seatVisuals, setSeatVisuals] = useState([]);

    Date.prototype.addDays = function(days) {
        var date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
    };

    const getDays = (() => {
        let arr = []
        var date = new Date();
        for (let i = 0; i < 7; i++) {
            let day = date.addDays(i);
            arr.push({label: day.toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric',}), value: day});
        }
        setSelectedDay(arr[0]);
        return arr;
    });

    const getTimes = (() => {
        const createTimeslots = ((startTime, endTime, intervalMinutes) => {
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
          
            const start = new Date();
            start.setHours(startHour, startMinute, 0, 0); // set start time
          
            const end = new Date();
            end.setHours(endHour, endMinute, 0, 0);   // set end time
          
            const timeslots = [];
            let currentTime = new Date(start); 

            while (currentTime < end) {
              const nextTime = new Date(currentTime.getTime() + intervalMinutes * 60000); // Add interval in milliseconds
              const formattedTimeslot = `${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${nextTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
              timeslots.push(formattedTimeslot);
              currentTime = nextTime;
            }
          
            return timeslots;
          });
          
          const filterPastTimeslots = ((timeslots) => {
            const now = new Date();
            return timeslots.filter(timeslot => {
              const [startTimeStr] = timeslot.split('-');
              const [hour, minute] = startTimeStr.split(':').map(Number);
              const startTime = new Date();
              startTime.setHours(hour, minute, 0, 0);
              return startTime > now;
            });
          });
          
          //previously 700 - 2400
          var allTimeslots = createTimeslots("07:00", "19:00", 30);

          //console.log("selected Day,", selectedDay);
          if (selectedDay != null && selectedDay.value.getDate() == today.getDate()) {
            allTimeslots = filterPastTimeslots(allTimeslots);
          }
          
          var options = [];

          for (var timeslot of allTimeslots) {
            options.push({label:timeslot, value:timeslot});
          }

          setTimes(options);
            
    });
    
    //fetches selected reservation and sets default values -- original reservation details
    useEffect(() => {
        const fetchReservation = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL.replace(/\/$/, "")}/api/reservations/edit/${id}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                setReservation(data);
    
                //console.log("Rooms:", rooms);
                //console.log("Searching for labID:", data.labID);
                
                const matchedRoom = rooms.find(room => room.value === data.labID);
                setSelectedRoom(matchedRoom);  
    
                //console.log("Matched Room:", matchedRoom); 

                const startDate = Array.isArray(data.startTime) ? data.startTime.map(time => new Date(time)) : [new Date(data.startTime)];
                const endDate = Array.isArray(data.endTime) ? data.endTime.map(time => new Date(time)) : [new Date(data.endTime)];
    
                if (startDate.some(date => isNaN(date)) || endDate.some(date => isNaN(date))) {
                    throw new Error("Invalid date format");
                }
    
                setSelectedDay({
                    label: startDate[0].toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                    value: startDate[0]
                });
                
    
                const timeLabels = startDate.map((start, index) => {
                    const startTimeLabel = `${start.getHours()}:${start.getMinutes().toString().padStart(2, '0')}`;
                    const endTimeLabel = `${endDate[index].getHours()}:${endDate[index].getMinutes().toString().padStart(2, '0')}`;
                    return `${startTimeLabel} - ${endTimeLabel}`;
                });
    
                //console.log("Start time and end:", timeLabels);
    
                setSelectedTime(startDate.map((start, index) => ({
                    label: timeLabels[index],
                    value: { startDate: start, endDate: endDate[index] }
                })));
    
                setSelectedSeat(data.seatNumber);
    
            } catch (error) {
                console.error("Error fetching reservation:", error);
                enqueueSnackbar("Failed to fetch reservation data.", { variant: 'error' });
            }
        };
    
        fetchReservation();
    }, [id]);
    

    useEffect(() => {
        //console.log("Updated selected room:", selectedRoom);
        //console.log("Updated time:", selectedTime);
    }, [selectedRoom, selectedTime]);

    /*
    useEffect(() => {
        if (selectedTime.length > 0) {
            getSeats(reservation?.userID);
        }
    }, [selectedTime]);
    */
    
    // gets all reservation, checks if any reservation conflicts with reservation to be edited
    const fetchUnavailableSeats = async (userID) => {
        if (!selectedRoom || !selectedRoom.value) {
            console.warn("Skipping fetch: Selected room is undefined.");
            return [];
        }
    
        const response = await fetch(`${process.env.REACT_APP_API_URL.replace(/\/$/, "")}/api/reservations`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const reservations = await response.json();
    
        if (!selectedDay || !(selectedDay.value instanceof Date)) {
            console.error("selectedDay is not a Date:", selectedDay);
            return [];
        }
    
        if (!selectedTime || selectedTime.length === 0 || !selectedTime[0]?.value) {
            console.warn("No time slot selected.");
            return [];
        }
    
        //console.log("Selected Time:", selectedTime);
        //console.log("Type of selectedTime[0].value:", typeof selectedTime[0]?.value);

    
        // Extract start and end times from selectedTime array
        const selectedTimeObj = selectedTime.map((timeSlot) => {
            const [startTime, endTime] = timeSlot.label.split(" - ");
            const [startHour, startMinute] = startTime.split(":").map(num => num.padStart(2, "0"));
            const [endHour, endMinute] = endTime.split(":").map(num => num.padStart(2, "0"));
    
            return {
                start: { hour: startHour, minute: startMinute },
                end: { hour: endHour, minute: endMinute }
            };
        });
    
        //console.log("Formatted selectedTime:", selectedTimeObj);
    
        const selectedDate = new Date(selectedDay.value);
    
        const startTimes = selectedTimeObj.map(time => {
            const date = new Date(selectedDate);
            date.setHours(parseInt(time.start.hour), parseInt(time.start.minute), 0, 0);
            return date;
        });
    
        //console.log("Start Times Array:", startTimes.map(date => date.toISOString()));
    
        const selectedSlots = selectedTimeObj.map((time, index) => ({
            label: `${selectedDay.label} (${time.start.hour}:${time.start.minute} - ${time.end.hour}:${time.end.minute})`,
            value: startTimes[index].toISOString()
        }));
    
        //console.log("Selected Slots:", selectedSlots);
    
        const conflictingReservations = reservations.filter((res) => {
            if (!Array.isArray(res.startTime) || res.startTime.some(date => isNaN(new Date(date).getTime()))) {
                console.warn("Invalid or non-array startTime found in reservation:", res.startTime);
                return false; 
            }
    
            const reservationStartDates = res.startTime.map(date => new Date(date).toISOString());
    
            return (
                res.labID === selectedRoom.value &&
                selectedSlots.some(slot => reservationStartDates.includes(slot.value))
            );
        });
    
        //console.log("Conflicting Reservations:", conflictingReservations);
    
        const unavailableSeatDetails = conflictingReservations
            .filter(res => res.seatNumber)
            .map(res => ({
                seatNumber: res.seatNumber,
                userID: res.userID || null,
                firstName: res.userDetails?.firstName || null,
                lastName: res.userDetails?.lastName || null,
                isAnonymous: res.isAnonymous ?? false
            }));
    
        //console.log("Unavailable seats:", unavailableSeatDetails);
        return unavailableSeatDetails;
    };
    
    const getSeats = useCallback(async () => {
        if (!selectedRoom || !selectedRoom.value) {
            console.warn("Skipping fetch: Selected room is undefined.");
            return;
        }
        if (!selectedTime || selectedTime.length === 0) {
            console.warn("Skipping fetch: Selected time slot is not selected.");
            return;
        }
        //console.log("Fetching seats for room:", selectedRoom.value);
        setLoading(true); 
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL.replace(/\/$/, "")}/api/lab/${selectedRoom.value}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const lab = await response.json();
    
            const capacity = lab.lab.capacity; 
            const unavailableSeats = await fetchUnavailableSeats();

            const seatData = [];
            for (let i = 1; i <= capacity; i++) {
                seatData.push({
                    seat: i.toString().padStart(2, "0"),
                    available: !unavailableSeats.some(seat => seat.seatNumber === i), 
                    selected: i === selectedSeat,
                    reservedTo: (() => {
                        const reservedSeat = unavailableSeats.find(seat => seat.seatNumber === i);
                        return reservedSeat 
                        ? (reservedSeat.isAnonymous ? "Anonymous" : `${reservedSeat.firstName} ${reservedSeat.lastName}`) 
                        : null;
                    })(),
                    userID: (() => {
                        const reservedSeat = unavailableSeats.find(seat => seat.seatNumber === i);
                        return reservedSeat ? reservedSeat.userID : null
                    })()
                });
            }
    
            setSeats(seatData);
        } catch (error) {
            console.error("Error fetching seats:", error);
            setError(error.message);
        } finally {
            setLoading(false);  
        }
    }, [selectedRoom, selectedDay, selectedTime]);
    /*    
    useEffect(() => {
        if (selectedRoom?.value) {
            getSeats();
        } else {
            console.warn("Skipping fetch: Selected room is undefined.");
        }
    }, [selectedRoom, selectedTime, selectedDay]);
    */

    useEffect(() => {
        if (selectedRoom?.value && selectedDay?.value && selectedTime?.length > 0) {
            //console.log("Fetching seats for room:", selectedRoom.value);
            fetchUnavailableSeats();
            getSeats();
        } else {
            console.warn("Skipping fetch: Missing required selections.");
            setSeats([]);
        }
    }, [selectedRoom, selectedDay, selectedTime]);

    const getSeatVisuals = (() => {
        var labVisuals = [];
        //console.log("Generating seat visuals for seats:", seats);

        for (let i = 0; i < seats.length; i++) {
            labVisuals.push(
                <div className={`w-80 h-8 px-4 py-1 ${seats[i].available ? `bg-bgblue` : `bg-fieldgray`} font-sans text-fontgray font-regular text-md`}
                    key={i}
                    id={i}
                    onClick={(e) => {
                        if (!seats[i].available) return;
                    
                        let index = parseInt(e.target.id, 10);
                    
                        const newSeats = seats.map((seat, j) => ({
                            ...seat,
                            selected: j === index ? !seat.selected : false // select the clicked seat, unselect others
                        }));
                    
                        setSeats(newSeats);
                    }}
                    >   
                    {(i+1).toString().padStart(2,"0")}
                    {seats[i].available ? "" : " : "}
                    {seats[i].reservedTo && seats[i].reservedTo != "Anonymous" ? 
                        <Link to={`/profile/user/${seats[i].userID}`}>{seats[i].reservedTo}</Link>
                        : seats[i].reservedTo == "Anonymous" ? "Anonymous" : ""}
                    {seats[i].selected ? " : SELECTED SEAT" : ""}
                </div>
            )
        }

        setSeatVisuals(labVisuals);
    });

    useEffect(() => {
        //console.log(seats);
        getSeatVisuals();
    }, [seats, selectedRoom, selectedDay, selectedTime]);

    useEffect(() => {
        getDays();
        getTimes();

        setIsLab(auth.user == "lab");

        getSeats();

        setToday(new Date());
        getSeats(); 
        const timer = setInterval(() => {
            setToday(new Date());
            getSeats();
        }, 60 * 1000);
        return () => clearInterval(timer);

    }, []);

    useEffect(() => {
        setDays(getDays());
    }, [today]);

    /*
    useEffect(() => {
        if (!reservation) {
            setSelectedTime([]);
        }
        getTimes();
    }, [selectedDay]);
    */
    useEffect(() => {
        setSelectedTime([]);
        getTimes();
    }, [selectedDay]);

    const handleCheckboxChange = (event) => {
        setIsAnonymous(event.target.checked); // true if checked, false if unchecked
    };

    const handleSubmit = ((e) => {
        e.preventDefault();
        //console.log(selectedSeat);

        const formData = new FormData(e.target);

        var obj = Object.fromEntries(Array.from(formData.keys()).map(key => [
            key, formData.getAll(key).length > 1 ? 
              formData.getAll(key) : formData.get(key)
          ])
        );
        
        var valid = true;

        try {
            obj.selectedSeat = seats.find((seat) => {
                return seat.selected
            }).seat; 
        } catch {
            valid = false;
        }

        //console.log("???: Obj: ",obj);

        // check if any fields in the form have been left blank
        for (let field in obj) {
            if (obj[field].length == 0) {
                valid = false;
                break;
            }
        }

        if (valid) {
            obj.day = new Date(obj.day).toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric',});
            if (typeof obj.timeslot == "string") {
                obj.timeslot = [obj.timeslot]
            }
            const confirmation = window.confirm("Are you sure you want to submit this reservation?");
            if (!confirmation) return; 
    
            setError("");
            submitData(obj);
        } else {
            setError("Required fields cannot be left blank.");
        }
    });

    const submitData = (async (formData) => {
        try {
            if (!formData || !formData.day || !formData.timeslot || formData.timeslot.length === 0) {
                console.error("Invalid formData: Missing required fields.");
                enqueueSnackbar("Please select a valid date and time slot.", { variant: 'error' });
                return;
            }
        
            // Convert `day` to a Date object
            const selectedDate = new Date(formData.day);
            if (isNaN(selectedDate.getTime())) {
                console.error("Invalid date:", formData.day);
                enqueueSnackbar("Invalid date selected.", { variant: 'error' });
                return;
            }
        
            // Extract start and end times as an array
            const timeSlots = formData.timeslot.map(slot => {
                const [startTime, endTime] = slot.split(" - "); // "09:00 - 09:30" -> ["09:00", "09:30"]
                const [startHour, startMinute] = startTime.split(":").map(Number);
                const [endHour, endMinute] = endTime.split(":").map(Number);
        
                return {
                    start: { hour: startHour, minute: startMinute },
                    end: { hour: endHour, minute: endMinute }
                };
            });
        
            //console.log("Formatted time slots:", timeSlots);
        
            // Create an array of start time Date objects
            const startTimes = timeSlots.map(time => {
                const date = new Date(selectedDate);
                date.setHours(time.start.hour, time.start.minute, 0, 0);
                return date;
            });

            // Create an array of end time Date objects
            const endTimes = timeSlots.map(time => {
                const date = new Date(selectedDate);
                date.setHours(time.end.hour, time.end.minute, 0, 0);
                return date;
            });
        
            //console.log("Start Times Array:", startTimes.map(date => date.toISOString()));
        
            // Use the first and last times to determine the reservation window
            const startDateTime = startTimes[0]; // First selected time
            const endDateTime = new Date(selectedDate);
            endDateTime.setHours(timeSlots[timeSlots.length - 1].end.hour, timeSlots[timeSlots.length - 1].end.minute, 0, 0);
        
            // Convert to ISO format for the database
            const formattedData = {
                labID: formData.room,
                startTime: startTimes.map(date => date.toISOString()), // Now an array of ISO date strings
                endTime: endTimes.map(date => date.toISOString()), // Last selected end time
                seatNumber: parseInt(formData.selectedSeat, 10),
                isAnonymous: isAnonymous,
            };
        
            //console.log("Formatted data for DB:", formattedData);

        const response = await fetch(`http://localhost:5000/api/reservations/resEdit/${id}`,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formattedData),
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorMessage}`);
        }
    } catch (error){
        console.error("Error submitting reservation:", error);
        enqueueSnackbar("Failed to reserve. Please try again.", { variant: 'error' });
    }
        setError("");
        enqueueSnackbar("Successfully edited!", {variant:'success', preventDuplicate:true});
    });

    return (
        <div className="flex flex-col">
            <div className='capitalize font-bold text-[24px] text-fontgray pb-1.5'>
                Edit Reservation
            </div>
            <form onSubmit={handleSubmit}>
                <label 
                    className="formlabel required"
                    htmlFor="room">
                        Room
                </label>
                <Select 
                    className='w-[216px] mb-3'
                    styles={{
                        control: (baseStyles, state) => ({
                            ...baseStyles,
                            background: '#f4f4f4',
                            border: 0,
                            boxShadow: 'none',}),
                    }}
                    id="room" 
                    name="room" 
                    options={rooms} 
                    value={selectedRoom}
                    onChange={(e) => {setSelectedRoom(e)}}/>

                <label 
                    className="formlabel required"
                    htmlFor="day">
                        Reservation Date
                </label>
                <Select 
                    className='w-[216px] mb-3'
                    styles={{
                        control: (baseStyles, state) => ({
                            ...baseStyles,
                            background: '#f4f4f4',
                            border: 0,
                            boxShadow: 'none',}),
                    }}
                    id="day" 
                    name="day" 
                    options={days} 
                    value={selectedDay}
                    onChange={(e) => {setSelectedDay(e)}}/>

                <label 
                    className="formlabel required"
                    htmlFor="timeslot">
                        Time Slot
                </label>
                <Select 
                    className='w-[450px] mb-3'
                    styles={{
                        control: (baseStyles, state) => ({
                            ...baseStyles,
                            background: '#f4f4f4',
                            border: 0,
                            boxShadow: 'none',}),
                    }}
                    id="timeslot" 
                    name="timeslot" 
                    isMulti
                    options={times} 
                    value={selectedTime}
                    onChange={(e) => {setSelectedTime(e)}}/>

                {
                    isLab ? 
                        <>
                            <label 
                                className="formlabel required"
                                htmlFor="student">
                                    Student Email
                            </label>
                            <input 
                                type="email"
                                className='forminput'
                                id="student" 
                                name="student" 
                                defaultValue={email}
                                required
                            />
                        </>
                    : <></>
                }

                <label 
                    className="formlabel required">
                        Seats
                </label>
                <div className='flex flex-col gap-2 p-2 w-fit'>
                    {seatVisuals}
                </div>

                <label 
                    className="formlabel mr-3"
                    htmlFor="anonymous">
                        Reserve anonymously?
                </label>
                <input 
                    type="checkbox"
                    id="anonymous"
                    name="anonymous"
                    checked={isAnonymous}
                    onChange={handleCheckboxChange} 
                    />
                <div className="msgerror">
                    {error}
                </div>
                <button className="formbutton w-40 mt-3" type="submit">SAVE CHANGES</button>
            </form>
        </div>
    );
}
