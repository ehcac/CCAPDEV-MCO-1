import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IconSortAscending, IconSortDescending, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

export default function Table({columnHeader, data, bordercolor, bgcolor, activeFunc, orderFunc, sortFieldFunc, pageFunc, total=69}) {
    const [table, setTable] = useState([]);
    const [sortField, setSortField] = useState("");
    const [nClick, setNClick] = useState(0);
    const [order, setOrder] = useState("desc");
    const [active, setActive] = useState(false);

    const [totalPages, setTotalPages] = useState(total);
    const [page, setPage] = useState(1);

    const navigate = useNavigate();

    const header = [];

    const renderSort = ((active, field) => {
        var color = '#4a4747';
        if (active && field == sortField) {
            color = '#5f92cc';
        }

        if ((order === "asc" && field == sortField) || !active || field != sortField) {
            return <IconSortDescending 
                color={color}
                size={20}
                stroke={2}
            />
        } else {
            return <IconSortAscending 
                color={color}
                size={20}
                stroke={2}
            />
        }
    });

    const handleSortClick = ((field) => {
        if (sortField == field) {
            if (nClick == 0) {
                setActive(true);

                activeFunc(true);
            } else if (nClick == 1) {
                setOrder("desc");

                orderFunc("desc");
            } else if (nClick == 2) {
                setOrder("asc");
                setActive(false);

                orderFunc("asc");
                activeFunc(false);
            }

            if (nClick == 2) {
                setNClick(0);
            } else {
                setNClick(nClick + 1);
            }
        } else {
            setSortField(field);
            setActive(true);
            setOrder("asc");
            setNClick(1);

            sortFieldFunc(field);
            activeFunc(true);
            orderFunc("asc");
        }
    });

    useEffect(() => {
        populate();
        //console.log(`${sortField} to be sorted in ${order} : now ${active}`);
    }, [data, sortField, order, active, page]);

    for (let i = 0; i < columnHeader.length; i++) {
        header.push(
            <th key={columnHeader[i].accessor}
                className={`capitalize font-medium`}>
                <div className={`flex flex-row space-x-1 px-2`}>
                    <div>
                        {columnHeader[i].label}
                    </div>
                    {
                        columnHeader[i].sortable ? 
                            <>
                                <div id={columnHeader[i].accessor}
                                    className={`self-center cursor-pointer`}
                                    onClick={(e)=> handleSortClick(e.currentTarget.id)}>
                                    {
                                        renderSort(active, columnHeader[i].accessor)
                                    }
                                </div>
                            </>
                        :
                            <> </>
                    }
                </div>
            </th>
        );
    }

    const populate = (() => {
        const tableData = [];

        for (let i = 0; i < data.length; i++) {
            var rowData = [];
            for (var column of columnHeader) {
                if (data[i].hasOwnProperty(column.accessor)) {
                    rowData.push(
                        <td key={column.accessor + "" + data[i]._id}
                            className='py-1 px-2'>
                            {data[i][column.accessor]}
                        </td>
                    );
                }
            }

            tableData.push(
                <tr key={data[i]._id} 
                    className={`odd:bg-white even:bg-fieldgray hover:bg-bgblue`}
                    onClick={() => {
                        navigate(data[i]._id, {state:{code:data[i].code, name:data[i].name}});
                    }}>
                        
                    {rowData}
                </tr>
            );
        }

        setTable(tableData);
        setTotalPages(total);
    });

    return (
        <>
            <div className={`my-3 flex flex-row`}>
                <div onClick={(e) => {
                    if (page-1 >= 1)
                        setPage(page - 1);
                }}>
                    <IconChevronLeft stroke={2} />
                </div>
                <div>
                    <input
                        className="w-8 rounded-md border-0 px-1 font-sans text-fontgray font-semibold text-sm bg-fieldgray outline-none"
                        type="text"
                        value={page}
                        onChange={(e) => {
                            e.currentTarget.value = e.currentTarget.value.replace(/[^0-9+]/g, '');
                            setPage(e.currentTarget.value);
                        }}
                        onBlur={(e) => {
                            if (e.currentTarget.value >= 1 && e.currentTarget.value <= totalPages) {
                                setPage(e.currentTarget.value);
                                pageFunc(e.currentTarget.value);
                            }
                            else if (e.currentTarget.value < 1 || totalPages == 0) {
                                setPage(1);
                                pageFunc(1);
                            } else {
                                setPage(totalPages);
                                pageFunc(totalPages);
                            }
                        }}
                    />
                </div>
                <div className='pl-1'>
                    out of {totalPages}
                </div>
                <div onClick={(e) => { 
                    if (Number(page) < totalPages)
                        setPage(Number(page) + 1);
                }}>
                    <IconChevronRight stroke={2} />
                </div>
            </div>
            <table className={`w-full table-auto my-3 rounded-sm bg-white border-solid border-2 ${bordercolor} text-left text-fontgray border-separate border-spacing-0`}>
                <thead className={`sticky top-0 shadow shadow-sm`}>
                    <tr className={`${bgcolor}`}>
                        {header}
                    </tr>
                </thead>
                <tbody className={`cursor-pointer`}>
                    {table}
                </tbody>
            </table>
        </>
    );
}