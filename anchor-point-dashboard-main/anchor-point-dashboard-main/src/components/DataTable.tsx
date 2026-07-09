import * as React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination } from '@mui/material';



export default function DataTable(props: any) {
  const rows = props.tableData
  const tableHeaders = props.headers
  const isPaginated = props.isPaginated

  const [page, setPage] = React.useState<number>(0)
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);
  const parseObjects = (obj: any, item: any) => {
    if (!obj) {
      return "N/A"
    }

    switch (Object.prototype.toString.call(obj)) {
      case "[object Array]":
        return obj.toString()
        break

      case "[object Object]":
        return obj ? obj[item] : ""
        break
    }
  }

  const handlePageChange = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage)
  }

  const handleRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }


  return (
    <>
      <TableContainer sx={props.containerStyles ? props.containerStyles : {}}>
        <Table aria-label="simple table">
          <TableHead sx={props.headerStyles ? props.headerStyles : {}}>
            <TableRow>
              {
                Object.values(tableHeaders).map((header: any) =>
                  typeof header !== "object"
                    ? (
                      <TableCell sx={{ fontWeight: 'bold' }} align='center'>
                        {header}
                      </TableCell>
                    ) : (
                      Object.values(header).map((item: any) => (
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {item}
                        </TableCell>
                      ))
                    )
                )
              }
            </TableRow>
          </TableHead>
          <TableBody>
            {/* {rows
              ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              ?.map((row: any) => (
                <TableRow
                key={row.booking_log_id || row.hotel_booking_guest_id || row.id}
                sx={{ 'td, th': { border: 0 } }}
                >
              {
                Object.keys(tableHeaders).map( (header) => {
                    return (
                      <>
                      {typeof row[header] === "object" 
                        ? Object.prototype.toString.call(row[header]) == "[object Array]"
                          ? <TableCell>
                            {row[header].length != 0 ? row[header].map((arr:any,index:number)=>(
                              Object.keys(arr).map((item:any)=>(
                                Object.keys(tableHeaders["waypoints"]).findIndex((val:any)=>val==item) != -1
                                ? <div><br/><p>{index+1 + ") " + parseObjects(arr,item) || "---"}</p></div>
                                : ""
                              ))
                            )) : "---"}
                          </TableCell>
                          : Object.keys(row[header]).map((item:any)=>(
                              Object.keys(tableHeaders["source"]).findIndex((val:any)=>val==item) != -1
                              ? <TableCell>{parseObjects(row[header],item) || "---"}</TableCell>
                              : ""
                            ))
                            : <TableCell> {row[header] || "---"} </TableCell>
                      }
                        </>
                    )
                })
              }
            </TableRow>
          ))} */}
            {rows && !rows[0]?.vehicle_no && !rows[0]?.vehicle_no ?
              rows.map((item, index) => (
                <TableRow key={index} sx={{}}>
                  <TableCell align='center'>{item?.name || ""}</TableCell>
                  <TableCell align='center'>{item?.email || ""}<br />{item?.alternate_email}</TableCell>
                  <TableCell align='center'>{item?.mobile || ""}<br />{item?.alternate_mobile}</TableCell>
                  <TableCell align='center'>{item?.flight_details || <div className='flex justify-center text-[19px]'>---</div>}</TableCell>
                  <TableCell align='center'>{item?.source?.title || "---"}<br />{item?.source?.name || "---"}<br />{item?.source?.landmark || "---"}<br />{item?.source?.address}</TableCell>
                  <TableCell align='center'>
                    {item?.waypoints?.length !== 0
                      ? item?.waypoints?.map((data, idx) => (
                        <div key={idx}>{data?.address}</div>
                      ))
                      : <div className='flex justify-center text-[19px]'>---</div>}
                  </TableCell>
                  {/* <TableCell>{item.waypoints.length != 0 ? item.waypoints : "---"}</TableCell> */}
                  <TableCell align='center'>{item?.destination?.title || "---"}<br />{item?.destination?.name || "---"}<br />{item?.destination?.landmark || "---"}<br />{item?.destination?.address || "---"}</TableCell>
                </TableRow>
              ))
              : !props.coordinator ?
              rows.map((item, index) => (
                <TableRow key={index} sx={{}}>
                  <TableCell align='center'>{item?.name || "---"}</TableCell>
                  <TableCell align='center'>{item?.primary_mobile || "---"}</TableCell>
                  <TableCell align='center'>{item?.secondary_mobile || "---"}</TableCell>
                  <TableCell align='center'>{item?.vehicle_no || "---"}</TableCell>
                </TableRow>
              )) : ""
            }
          </TableBody>
        </Table>
      </TableContainer>
      {isPaginated == true ?
        <TablePagination
          rowsPerPageOptions={[5, 10]}
          component="div"
          count={rows?.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPage}
        />
        : ""}
    </>
  );
}