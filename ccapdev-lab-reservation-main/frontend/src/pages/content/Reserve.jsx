import { useAuth } from '../../AuthProvider.jsx';
import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { useSnackbar } from "notistack";

export default function Reserve() {
    const { enqueueSnackbar } = useSnackbar();

    const auth = useAuth();
    const [isLab, setIsLab] = useState(false);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const rooms = [{ label: "GK301", value: "GK301" }, { label: "GK404", value: "GK404" }, { label: "GK304A", value: "GK304A" }];

    const [selectedRoom, setSelectedRoom] = useState();
    const [today, setToday] = useState(new Date());
    const [days, setDays] = useState([]);
    const [selectedDay, setSelectedDay] = useState(days[0]);
    const [times, setTimes] = useState([]);
    const [selectedTime, setSelectedTime] = useState([]);
    const [labCapacity, setLabCapacity] = useState(30);
    const [isAnonymous, setIsAnonymous] = useState(false);

    const [seats, setSeats] = useState([]);
    const [seatVisuals, setSeatVisuals] = useState([]);
    const apiUrl = process.env.REACT_APP_API_URL;


    const [user, setUser] = useState(() => {
            return (JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"))) ?? null
    });

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
            start.setHours(startHour, startMinute, 0, 0); // Set start time
          
            const end = new Date();
            end.setHours(endHour, endMinute, 0, 0);   // Set end time
          
            const timeslots = [];
            let currentTime = new Date(start); // Start from the beginning
          
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
          
          var allTimeslots = createTimeslots("07:00", "19:00", 30);

          if (selectedDay != null && selectedDay.value.getDate() == today.getDate()) {
            allTimeslots = filterPastTimeslots(allTimeslots);
          }
          
          var options = [];

          for (var timeslot of allTimeslots) {
            options.push({label:timeslot, value:timeslot});
          }

          setTimes(options); 
    });

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
    
        // Extract start and end times from selectedTime array
        const selectedTimeObj = selectedTime.map((timeSlot) => {
            const [startTime, endTime] = timeSlot.value.split(" - ");
            const [startHour, startMinute] = startTime.split(":").map(num => num.padStart(2, "0"));
            const [endHour, endMinute] = endTime.split(":").map(num => num.padStart(2, "0"));
    
            return {
                start: { hour: startHour, minute: startMinute },
                end: { hour: endHour, minute: endMinute }
            };
        });
    
        //console.log("Formatted selectedTime:", selectedTimeObj);
    
        // Ensure selectedDay.value is a Date before using setHours()
        const selectedDate = new Date(selectedDay.value);
    
        // Create an array of startTime Dates
        const startTimes = selectedTimeObj.map(time => {
            const date = new Date(selectedDate);
            date.setHours(parseInt(time.start.hour), parseInt(time.start.minute), 0, 0);
            return date;
        });
    
        //console.log("Start Times Array:", startTimes.map(date => date.toISOString()));
    
        // Construct selectedSlot array in the format:
        const selectedSlots = selectedTimeObj.map((time, index) => ({
            label: `${selectedDay.label} (${time.start.hour}:${time.start.minute} - ${time.end.hour}:${time.end.minute})`,
            value: startTimes[index].toISOString()
        }));
    
        //console.log("Selected Slots:", selectedSlots);
    
        // Filter reservations that match ANY of the selected time slots
        const conflictingReservations = reservations.filter((res) => {
            // Check if res.startTime is an array of Date objects
            if (!Array.isArray(res.startTime) || res.startTime.some(date => isNaN(new Date(date).getTime()))) {
                console.warn("Invalid or non-array startTime found in reservation:", res.startTime);
                return false; // Skip invalid reservations
            }
    
            // Convert all startTime values in the array to ISO strings for comparison
            const reservationStartDates = res.startTime.map(date => new Date(date).toISOString());
    
            // Check if any of the reservation start dates match any of the selected slots
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
    
    
    const getSeats = useCallback(async (userID) => {
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
    
            setLabCapacity(lab.lab.capacity);
            //console.log("Lab:", lab.lab.capacity);
            const unavailableSeats = await fetchUnavailableSeats();

            const seatData = [];
            for (let i = 1; i <= labCapacity; i++) {
                seatData.push({
                    seat: i.toString().padStart(2, "0"),
                    available: !unavailableSeats.some(seat => seat.seatNumber === i), 
                    //selected: i === selectedSeat,
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
    }, [selectedRoom, selectedTime]);
        
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

        for (let i = 0; i < seats.length; i++) {
            labVisuals.push(
                <div className={`w-80 h-8 px-4 py-1 ${seats[i].available ? `bg-bgblue` : `bg-fieldgray`} font-sans text-fontgray font-regular text-md`}
                    key={i}
                    id={i}
                    onClick={(e) => {
                        if (!seats[i].available) return; 
                
                        let index = e.target.id;
                        for (let j = 0; j < seats.length; j++) {
                            if (seats[j].available) {
                                if (seats[j].selected && j != index) {
                                    seats[j].selected = false;
                                } else if (j == index) {
                                    seats[j].selected = !seats[j].selected;
                                }
                            }
                        }
                        setSeats([...seats]);
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
        //console.log(seats)
        getSeatVisuals();
    }, [seats, selectedRoom, selectedDay, selectedTime])


    useEffect(() => {
        setIsLab(auth.user.role == "technician");

        getSeats();

        const timer = setInterval(() => {
            setToday(new Date());
            getSeats();
        }, 60 * 1000);
        return () => {
            clearInterval(timer);
        }
    }, []);

    useEffect(() => {
        setDays(getDays());
    }, [today]);

    useEffect(() => {
        setSelectedTime([]);
        getTimes();
    }, [selectedDay]);

    const handleCheckboxChange = (event) => {
        setIsAnonymous(event.target.checked); // true if checked, false if unchecked
    };

    const handleSubmit = ((e) => {
        e.preventDefault();

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

        //console.log(obj);

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
            setError("");
            submitData(obj);
        } else {
            setError("Required fields cannot be left blank.");
        }
    });

    //add it to the database:
    const submitData = (async (formData) => {
        //console.log(formData);
        /* this is formData
        day: "March 13, 2025"
        room: "GK404"
        selectedSeat: "17"
        timeslot: Array(1)
        0: "09:00 - 09:30"
        
        this is what is in the database an example:
        userID "23881250-e567-41be-875f-a435dabeab50"
        labID "GK404"
        startTime 2025-03-13T11:00:00.000+00:00
        endTime 2025-03-13T11:30:00.000+00:00
        seatNumber 7
        isAnonymous false
        createdAt 2025-03-08T11:00:00.000+00:00
        updatedAt 2025-03-08T11:00:00.000+00:00
        */

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
                userID: user.otherID,
                labID: formData.room,
                startTime: startTimes.map(date => date.toISOString()), // Now an array of ISO date strings
                endTime: endTimes.map(date => date.toISOString()), // Last selected end time
                seatNumber: parseInt(formData.selectedSeat, 10),
                isAnonymous: isAnonymous,
            };
        
            //console.log("Formatted data for DB:", formattedData);
        
            // Send to the server
            const response = await fetch(`${process.env.REACT_APP_API_URL.replace(/\/$/, "")}/api/reservations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });
        
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        
            const responseData = await response.json();
            //console.log("Server Response:", responseData);
        
            // If successful, show success notification
            enqueueSnackbar("Successfully reserved!", { variant: 'success', preventDuplicate: true });
            setError("");
        } catch (error) {
            console.error("Error submitting reservation:", error);
            enqueueSnackbar("Failed to reserve. Please try again.", { variant: 'error' });
        }
        
        setError("");
        enqueueSnackbar("Successfully reserved!", { variant: 'success', preventDuplicate: true });
    });        

    return (
        <div className="flex flex-col">
            <div className='capitalize font-bold text-[24px] text-fontgray pb-1.5'>
                Reserve
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

                {/*
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
                                required
                            />
                        </>
                    : <></>
                */}

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
                <button className="formbutton mt-3" type="submit">RESERVE</button>
            </form>
        </div>
    );
}
