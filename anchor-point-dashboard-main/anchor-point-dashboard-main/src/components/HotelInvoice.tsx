import {
  Backdrop,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { uid } from "uid";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { BASE_URL } from "../constants/string";
import Toast from "./Toast";

const HotelInvoice = (props: any) => {
  const [taxRate, setTaxRate] = useState(0);
  const [taxableSubtotal, setTaxableSubTotal] = useState(0);
  const [nonTaxableSubtotal, setNonTaxableSubTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState(
    props?.invoiceData?.invoice_items || [
      {
        id: uid(6) || 0,
        sac: 998551,
        name: "",
        quantity: 1,
        rate: 1,
        tax_percent: 18,
        tax_rate: 0,
        amount: 0,
      },
    ],
  );
  const [data, setData] = useState<any>([]);
  const [progress, setProgress] = useState(0);
  const [loader, setLoader] = useState(false);
  const [edit, setEdit] = useState(false);
  const [buffer, setBuffer] = useState(false);
  const [invoiceClientPDF, setInvoiceClientPDF] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [description, setDescription] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState("");
  const isSuperOrganizer = localStorage.getItem("role");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const packageResponse = await fetch(
          `${BASE_URL}/hotel_bookings/vendors/${props?.vendorId}/pricing`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "Bearer " + localStorage.getItem("userToken"),
            },
          },
        );
        const packageData = await packageResponse.json();
        if (!packageResponse.ok) {
          packageResponse.status != 422 && packageResponse.status != 500
            ? console.log("Error:", packageData)
            : "";
          throw new Error("Error fetching package details");
        }
        setData(packageData.hotel_pricing);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (props?.invoiceData?.invoice_items) {
      setItems(props?.invoiceData?.invoice_items);
      setPoNumber(props?.invoiceData?.po_number);
      setDescription(props?.invoiceData?.description);
      setInvoiceClientPDF(props?.invoiceData?.s3_url);
      setEdit(true);
    }
  }, [props.invoiceData]);

  const reviewInvoiceHandler = async (event: any) => {
    event.preventDefault();
    setLoader(true);
    for (let i in items) {
      if (items[i].name.trim() == "" || items[i].sac == "") {
        alert("Please fill all the columns");
        return;
      }
    }
    let body = {
      taxable_amount: taxableSubtotal,
      non_taxable_amount: nonTaxableSubtotal,
      cgst_amount: Number(taxRate / 2).toFixed(2),
      sgst_amount: Number(taxRate / 2).toFixed(2),
      total_amount: total.toFixed(2),
      po_number: poNumber,
      description: description,
      invoice_items: [{}],
    };
    if (edit) {
      const deleted_items = props?.invoiceData?.invoice_items.filter(
        (item: any) => !items.find((obj: any) => obj.id == item.id),
      );
      const edited_items = [
        ...items,
        ...deleted_items.map((del: any) => {
          return { ...del, delete: true };
        }),
      ];

      body = {
        ...body,
        id: props?.invoiceData?.id,
        invoice_items: edited_items.map((item: any) => {
          typeof item.id == "string" ? delete item.id : "";
          return item;
        }),
      };
    } else {
      body = {
        ...body,
        invoice_items: items.map((item: any) => {
          delete item.id;
          return item;
        }),
      };
    }

    try {
      const response = await fetch(
        `${BASE_URL}/hotel_bookings/${props?.bookingId}/generate-invoice`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error generating invoice");
      }
      setLoader(false);
      setBuffer(true);
      setEdit(true);
      const curr_time = new Date()
        .toISOString()
        .replace("Z", "")
        .replace("T", " ")
        .split(".")[0];

      var tt = setInterval(function () {
        setProgress((prev: any) => (prev >= 100 ? 0 : prev + 10));
      }, 1000);

      var down = setInterval(function () {
        downloadInvoice(down, curr_time);
      }, 3000);

      setTimeout(function () {
        clearInterval(tt);
        clearInterval(down);
      }, 30000);

      setAlertType("success");
      setAlertMsg(data.message);
      setTimeout(() => {
        setAlertMsg("");
      }, 2000);
    } catch (error) {
      console.log(error);
      setLoader(false);
      setAlertType("error");
      setAlertMsg("Error generating invoice");
      setTimeout(() => {
        setAlertMsg("");
      }, 3000);
    }
  };

  const downloadInvoice = async (down: any, curr_time: string) => {
    const status = await fetchPDF(curr_time);
    if (status == "Success") {
      clearInterval(down);
      setBuffer(false);
    }
    return;
  };

  const fetchPDF = async (curr_time: any) => {
    try {
      const response = await fetch(
        `${BASE_URL}/invoices/client/presigned_url/${props?.bookingId}?invoice_time=${curr_time}`,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("userToken"),
          },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        response.status != 422 && response.status != 500
          ? console.log("Error:", data)
          : "";
        throw new Error("Error fetching Invoice PDF");
      }
      if (data.s3_invoice_url != null) {
        setInvoiceClientPDF(data.s3_invoice_url);
        return "Success";
      } else {
        return data.s3_invoice_url;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const addItemHandler = () => {
    const id = uid(6);
    setItems((prevItem: any) => [
      ...prevItem,
      {
        id: id,
        sac: 998551,
        name: "",
        quantity: 1,
        rate: 1,
        tax_percent: 18,
        tax_rate: 0,
        amount: 0,
      },
    ]);
  };

  const deleteItemHandler = (id: any) => {
    setItems((prevItem: any) => prevItem.filter((item: any) => item.id != id));
  };

  const edtiItemHandler = (event: any, type = "other") => {
    const editedItem = {
      id: event.target.id,
      name: event.target.name,
      value: event.target.value,
    };

    if (type == "name") {
      const filteredData = data.filter(
        (val: any) => val.name === editedItem.value,
      );
      if (filteredData.length != 0) {
        const newItems = items?.map((item: any) => {
          if (item.id == editedItem.id) {
            for (let key in filteredData[0]) {
              item[key] = filteredData[0][key];
            }
          }
          return item;
        });
        setItems(newItems);
      } else {
        const newItems = items?.map((items: any) => {
          for (const key in items) {
            if (key === editedItem.name && items.id == editedItem.id) {
              items[key] = editedItem.value;
            }
          }
          return items;
        });
        setItems(newItems);
      }
    } else {
      const newItems = items?.map((items: any) => {
        for (const key in items) {
          if (key === editedItem.name && items.id == editedItem.id) {
            items[key] = editedItem.value;
          }
        }
        return items;
      });
      setItems(newItems);
    }
  };

  useEffect(() => {
    const newItems = items?.map((item: any) => {
      let temp = item;
      temp.tax_rate =
        (Number(temp.tax_percent) *
          Number(temp.rate * Math.floor(temp.quantity))) /
        100;
      temp.amount =
        Number(temp.tax_rate) + Number(temp.rate * Math.floor(temp.quantity));
      return temp;
    });

    setItems(newItems);

    const taxsub = items?.reduce((prev: any, curr: any) => {
      return curr.tax_percent != 0
        ? prev + Number(curr.rate * Math.floor(curr.quantity))
        : prev;
    }, 0);

    const nontaxsub = items?.reduce((prev: any, curr: any) => {
      return curr.tax_percent == 0
        ? prev + Number(curr.rate * Math.floor(curr.quantity))
        : prev;
    }, 0);

    const taxRates = items?.reduce((prev: any, curr: any) => {
      return prev + Number(curr.tax_rate);
    }, 0);

    const tot = taxsub + nontaxsub + taxRates;

    setTaxableSubTotal(taxsub);
    setNonTaxableSubTotal(nontaxsub);
    setTaxRate(taxRates);
    setTotal(tot);
  }, [JSON.stringify(items)]);

  return (
    <form
      onSubmit={reviewInvoiceHandler}
      className="relative flex flex-col px-2 md:flex-row"
    >
      <div className="my-6 flex-1 space-y-2  rounded-md bg-white p-4 shadow-sm sm:space-y-4 md:p-6">
        <div className="mb-5 items-end justify-end">
          {alertMsg && <Toast message={alertMsg} toastType={alertType} />}
        </div>
        <div className="flex flex-row justify-end items-center mb-10 gap-2">
          <span className={"font-bold"}>PO Number</span>
          <TextField
            variant="standard"
            inputProps={{ style: { textAlign: "right" } }}
            value={poNumber}
            onChange={(e: any) => setPoNumber(e.target.value)}
          />
        </div>
        <table className="w-full p-4 text-left">
          <thead>
            <tr className="border-b border-gray-900/10 text-sm md:text-base">
              <th>S.No</th>
              <th className="text-left">SAC</th>
              <th>ITEM</th>
              <th className="text-center">QTY</th>
              <th className="text-center">RATE</th>
              <th className="text-center">TAX (%)</th>
              <th className="text-center">TAX RATE</th>
              <th className="text-center">AMOUNT</th>
              <th className="text-center">DELETE</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: any, index: number) => (
              <tr>
                <td>
                  <span>{index + 1}</span>
                </td>
                <td>
                  <input
                    size={10}
                    type={"text"}
                    placeholder={"SAC Code"}
                    name={"sac"}
                    id={String(item.id)}
                    value={item.sac || ""}
                    onChange={(event: any) => edtiItemHandler(event)}
                    required
                  />
                </td>
                <td>
                  <input
                    size={40}
                    type={"text"}
                    placeholder={"Item name"}
                    name={"name"}
                    list="plans"
                    id={String(item.id)}
                    value={item.name}
                    onChange={(event: any) => edtiItemHandler(event, "name")}
                    required
                  />
                  <datalist id={"plans"}>
                    {data.map((item: any) => (
                      <option value={item.name}>{item.name}</option>
                    ))}
                  </datalist>
                </td>
                <td>
                  <input
                    className={"text-right w-16"}
                    type={"number"}
                    min={"1"}
                    name={"quantity"}
                    id={String(item.id)}
                    value={item.quantity}
                    onChange={(e: any) => edtiItemHandler(e)}
                    required
                  />
                </td>
                <td>
                  <input
                    className={
                      "text-right w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    }
                    type={"number"}
                    step={"0.01"}
                    min={"1"}
                    name={"rate"}
                    id={String(item.id)}
                    value={item.rate}
                    onChange={(event: any) => edtiItemHandler(event)}
                    required
                  />
                </td>
                <td>
                  <input
                    className={
                      "text-right w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    }
                    type={"number"}
                    min={"0"}
                    step={"0.01"}
                    name={"tax_percent"}
                    id={String(item.id)}
                    value={item.tax_percent}
                    onChange={(event: any) => edtiItemHandler(event)}
                    required
                  />
                </td>
                <td className=" w-32 text-center">
                  <span>{item.tax_rate.toFixed(2)}</span>
                </td>
                <td className=" w-32 text-center">
                  <span>{item.amount.toFixed(2)}</span>
                </td>
                <td className="flex items-center justify-center">
                  <button
                    className="rounded-md bg-red-500 p-2 text-white shadow-sm transition-colors duration-200 hover:bg-red-600"
                    type="button"
                    onClick={() => deleteItemHandler(item.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-600"
          type="button"
          onClick={addItemHandler}
        >
          Add Item
        </button>
        <div className="flex flex-col items-end space-y-2 pt-6">
          <div className="flex w-full justify-between md:w-1/2">
            <span className="font-bold">Non Taxable Subtotal:</span>
            <span>{nonTaxableSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex w-full justify-between md:w-1/2">
            <span className="font-bold">Taxable Subtotal:</span>
            <span>{taxableSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex w-full justify-between md:w-1/2">
            <span className="font-bold">SGST:</span>
            <span>{Number(taxRate / 2).toFixed(2)}</span>
          </div>
          <div className="flex w-full justify-between md:w-1/2">
            <span className="font-bold">CGST:</span>
            <span>{Number(taxRate / 2).toFixed(2)}</span>
          </div>
          <div className="flex w-full justify-between border-t border-gray-900/10 pt-2 md:w-1/2">
            <span className="font-bold">Total:</span>
            <span className="font-bold">
              {total % 1 === 0 ? total : total.toFixed(2)}
            </span>
          </div>
        </div>
        <div>
          <TextField
            multiline
            maxRows={Infinity}
            rows={4}
            className="w-80"
            label="Invoice Description"
            placeholder="Add description if applicable"
            value={description}
            onChange={(e: any) => setDescription(e.target.value)}
          ></TextField>
        </div>
        <div className="flex justify-center">
          <div className="flex flex-row">
            <Button
              type="submit"
              disabled={items?.length == 0 || (edit && isSuperOrganizer == "0")}
              color="success"
              variant="contained"
            >
              {edit ? "Update Invoice" : "Create Invoice"}
            </Button>
            <div className="ml-5">
              {buffer ? (
                <CircularProgress variant="determinate" value={progress} />
              ) : (
                invoiceClientPDF && (
                  <a href={invoiceClientPDF} download target="_blank">
                    <IconButton color="info">
                      Invoice
                      <DownloadRoundedIcon />
                    </IconButton>
                  </a>
                )
              )}
            </div>
            <div>
              <Backdrop
                sx={{
                  color: "#fff",
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
                open={loader ? true : false}
              >
                <div className="flex flex-col justify-center items-center">
                  <Typography>Please wait</Typography>
                  <CircularProgress color="inherit" />
                </div>
              </Backdrop>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default HotelInvoice;
