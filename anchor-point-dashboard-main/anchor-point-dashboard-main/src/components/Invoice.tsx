import CheckBox from "@mui/material/Checkbox"
import { Button, FormControlLabel, FormGroup, IconButton, InputAdornment, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material"
import { useEffect, useMemo, useRef, useState } from "react"
import DialogTitle from '@mui/material/DialogTitle'
import Dialog from '@mui/material/Dialog'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import DiscountIcon from '@mui/icons-material/Discount';
import PercentIcon from '@mui/icons-material/Percent';
import { BASE_URL, INVOICE_STATUS } from "../constants/string"
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { AddCircle, Close } from "@mui/icons-material";
import CircularProgress from '@mui/material/CircularProgress'
import { Box } from "@mui/system";
import Autocomplete from '@mui/material/Autocomplete';
import { orderBy } from "firebase/firestore"
import { id } from "date-fns/locale"
import { loadConfigFromFile } from "vite"
import Toast from "./Toast";
import { cleanDigitSectionValue } from "@mui/x-date-pickers/internals/hooks/useField/useField.utils"
import { useDispatch} from 'react-redux';
import { AppDispatch } from "../store/store";
import { setCreditNoteInvoice,clearCreditNoteInvoice } from "../store/features/creditNoteSlice"


function Invoice(props: any) {
    const [extraKms, setExtraKms] = useState<number>(0)
    const [extraHrs, setExtraHrs] = useState<number>(0)
    const [extraKmsIncluded, setExtraKmsIncluded] = useState(0)
    const [extraHrsIncluded, setExtraHrsIncluded] = useState(0)
    const [kmsCost, setKmsCost] = useState(0)
    const [hrsCost, setHrsCost] = useState(0)
    const [discounts, setDiscounts] = useState<number>(0)
    const [discountedAmt, setDiscountedAmt] = useState(0)
    const [discountsIncluded, setDiscountsIncluded] = useState(false)
    const [batta, setBatta] = useState<number>(0)
    const [miscellaneous, setMiscellaneous] = useState<number>(0)
    const [parking, setParking] = useState<number>(0)
    const [cancellation, setCancellation] = useState(0)
    const [taxableTotal, setTaxableTotal] = useState<number>(0)
    const [nonTaxableTotal, setNonTaxableTotal] = useState(0)
    const [baseFare, setBaseFare] = useState<number>(0)
    const [tax, setTax] = useState(0)
    const [taxAmnt, setTaxAmnt] = useState(0)
    const [baseFareClient, setBaseFareClient] = useState(0)
    const [organizerTaxAmnt, setOrganizerTaxAmnt] = useState(0)
    const [clientTaxableSubTotal, setClientTaxableSubTotal] = useState(0)
    const [clientTaxableTotal, setClientTaxableTotal] = useState(0)
    const [clientDiscount, setClientDiscount] = useState(0)
    const [clientDiscountAmnt, setClientDiscountAmnt] = useState(0)
    const [clientDiscountsIncluded, setClientDiscountsIncluded] = useState(false)
    const [invoiceSent, setInvoiceSent] = useState(false)
    const [visible, setVisible] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [comments, setComments] = useState("")
    const [status, setStatus] = useState("")
    const [proofs, setProofs] = useState<any>([])
    const [clientInvoiceDialog, setClientInvoiceDialog] = useState(false)
    const [isTotalEdit, setIsTotalEdit] = useState(false)
    const [progress, setProgress] = useState(0)
    const [buffer, setBuffer] = useState(false)
    const [invoiceClientPDF, setInvoiceClientPDF] = useState("")
    const [proofError, setProofError] = useState(false)
    const [rejectedDocs, setRejectedDocs] = useState([])
    const [description, setDescription] = useState("")
    const [poNumber, setPoNumber] = useState("")
    const taxRef = useRef(taxAmnt)

    const [isCity, setIsCity] = useState("")
    const [planPackage, setPlanPackage] = useState([])
    const [invoiceCost, setInvoiceCost] = useState<number>(0);
    const [invoiceExtraDistance, setInvoiceExtraDistance] = useState<number>(0);
    const [invoiceExtraHrs, setInvoiceExtraHrs] = useState<number>(0);
    const [invoiceDriverBatta, setInvoiceDriverBatta] = useState<number>(0);
    const [invoiceParkingTool, setInvoiceParkingTool] = useState<number>(0);
    const [invoiceMiscellaneas, setInvoiceMiscellaneas] = useState<number>(0);
    const [invoiceNonTaxableTotal, setInvoiceNonTaxableTotal] = useState<number>(0)
    const [clientDescription, setClientDescription] = useState("")
    const [showInvoice, setShowInvoice] = useState(false)
    const [isPackageSelect, setIsPackageSelect] = useState(false)
    const [tariffDiscount, setTariffDiscount] = useState(0)
    const [tariffDiscountAmt, setTariffDiscountAmt] = useState(0)
    const [tariffPlanId,setTariffPlanId]=useState<number>(0)

    const [extraDistanceQty, setExtraDistanceQty] = useState(0)
    const [extraDurationQty, setExtraDurationQty] = useState(0)

    const [vendorPackage, setVendorPackage] = useState([])
    const [planId, setPlanId] = useState(0)
    const [selectedPackage, setSelectedPackage] = useState("")
    const [selectedVehicle,setSelectedVehicle] = useState<any>();
    const [invoiceApproved, setInvoiceApproved] = useState(false)

    const [packageWithVehicle,setPackageWithVehicle] = useState<any>()
    const [vehicles,setVehicles] = useState<any>();
    const [packageId,setPackageId] = useState<any>();
    const [vehicleId,setVehicleId] = useState<number>();

    const dispatch = useDispatch<AppDispatch>()

    const[clientProofsExist,setClientProofsExist] = useState<any>()
    const [isVisible, setIsVisible] = useState<boolean>(true)

    const isVendor = localStorage.getItem("isVendor")
    const isSuperOrganizer = localStorage.getItem("role")

    const MAX_FILE_SIZE = 5 * 1000 * 1024
    const MAX_PROOF_LENGTH = 3

    let kmsText = `This trip exceeded by ${extraKms} Kms. Include extra amount Rs.${extraKms * kmsCost} ?`
    let hrsText = `This trip exceeded by ${extraHrs} Hrs. Include extra amount Rs.${extraHrs * hrsCost} ?`

    const calcSum = (sum: number, paramtax = tax, disCancel = false) => {
        !disCancel ? sum = sum + discountedAmt : ""
        let amt = Math.round(((paramtax / 100) * sum) * 100) / 100
        sum = Math.round((sum + amt) * 100) / 100
        setTaxAmnt(amt)
        setTaxableTotal(sum)
        taxRef.current = amt
    }

    const calcDiscountedAmount = (discounts: number, basefare: number, sum = taxableTotal, paramtax = tax, type = "vendor") => {
        const amnt = Math.round(((discounts / 100) * basefare) * 100) / 100
        if (type == "vendor") {
            setDiscountedAmt(amnt)
            calcSum((sum) - amnt, paramtax, true)
        } else if (type == "client") {
            setClientDiscountAmnt(amnt)
            calcClientSum(sum - amnt)
        }
    }

    const calcClientSum = (sum: number) => {
        setClientTaxableSubTotal(Math.round(sum * 100) / 100)
        let amt = Math.round(((2.5 / 100) * sum) * 100) / 100
        sum = Math.round((sum + (amt * 2)) * 100) / 100
        setOrganizerTaxAmnt(amt)
        setClientTaxableTotal(sum)
    }

    useEffect(() => {
        if (!props.data.message) {
            setBatta(props.data?.driver_charge)
            setExtraKms(props.data?.calculated_extra_kms)
            setExtraHrs(props.data?.calculated_extra_hrs)
            setBaseFare(props.data?.vendor_cost)
            setKmsCost(props.data?.extra_distance_cost)
            setHrsCost(props.data?.extra_hour_cost)
            setTax(props.data?.vendor_tax)
            let nontaxable = props.data?.driver_charge
            let sum = props.data?.vendor_cost
            if (props.data?.invoice_info) {
                setExtraKmsIncluded(props.data?.invoice_info?.extra_kms)
                setExtraHrsIncluded(props.data?.invoice_info?.extra_hrs)
                setDiscounts(props.data?.invoice_info?.discount_percent)
                setDescription(props.data?.invoice_info?.description || "")
                setInvoiceSent(((props.data?.invoice_info ? (props.data?.invoice_info?.event != INVOICE_STATUS.INVOICE_REJECTED) ? true : false : false)));

                (props.data?.client_invoice_info && isSuperOrganizer == "0")
                    ? setIsTotalEdit(false)
                    : setIsTotalEdit(true)

                setBaseFare(props.data?.invoice_info?.base_fare)
                setBatta(props.data?.invoice_info?.driver_charge)
                setParking(props.data?.invoice_info?.parking_and_toll)
                setMiscellaneous(props.data?.invoice_info?.miscellaneous)
                setCancellation(props.data?.invoice_info?.cancellation_amount)
                if (isVendor == "true" || props.isVendor){
                    props.data?.invoice_info?.event != INVOICE_STATUS.INVOICE_REJECTED ? setProofs(props.data?.invoice_info?.documents) : setRejectedDocs(props.data?.invoice_info?.documents)
                }
                if(props.toVendor){
                    setProofs(props.data?.invoice_info?.documents)
                }
                if (props.data?.invoice_info?.base_fare) sum = sum - props.data?.vendor_cost + props.data?.invoice_info?.base_fare
                if (props.data?.invoice_info?.parking_and_toll) nontaxable = nontaxable + props.data?.invoice_info?.parking_and_toll
                if (props.data?.invoice_info?.miscellaneous) nontaxable = nontaxable + props.data?.invoice_info?.miscellaneous
                if (props.data?.invoice_info?.cancellation_amount) sum = sum + props.data?.invoice_info?.cancellation_amount
                if (props.data?.invoice_info?.discount_percent)
                    calcDiscountedAmount(props.data?.invoice_info?.discount_percent, props.data?.invoice_info?.base_fare, sum, props.data?.vendor_tax)
                else
                    calcSum(sum, props.data?.vendor_tax)

                let vendor_cost = props.data?.invoice_info?.base_fare
                let amt = Math.round(((10 / 100) * vendor_cost) * 100) / 100;
                (props.toClient) ? setBaseFareClient(vendor_cost + amt) : ""
                if (!props.data?.client_invoice_info && props.toClient) {
                    sum = sum + amt
                }
                setClientTaxableSubTotal(sum)
                calcClientSum(sum)
            } else {
                calcSum(sum, props.data?.vendor_tax)
            }
            if (props.data?.client_invoice_info && props.toClient) {
                if (props.data?.client_invoice_info?.base_fare || props.state?.isBookingCancelled) {
                    sum = parseFloat(props.data?.client_invoice_info?.base_fare)
                    if (props.data?.client_invoice_info?.cancellation_amount) sum = sum + props.data?.client_invoice_info?.cancellation_amount
                    setCancellation(props.data?.client_invoice_info?.cancellation_amount)
                    setBaseFareClient(props.data?.client_invoice_info?.base_fare)
                    setClientTaxableSubTotal(sum)
                }
                setDescription(props.data?.client_invoice_info?.description)
                setPoNumber(props.data?.client_invoice_info?.po_number)
                setBatta(props.data?.client_invoice_info?.driver_charge)
                setParking(props.data?.client_invoice_info?.parking_and_toll)
                setMiscellaneous(props.data?.client_invoice_info?.miscellaneous)
                setInvoiceClientPDF(props.data?.client_invoice_info?.s3_invoice_url)
                setClientDiscount(props.data?.client_invoice_info?.discount_percent)
                props.data?.client_invoice_info?.discount_percent
                    ? calcDiscountedAmount(props.data?.client_invoice_info?.discount_percent, props.data?.client_invoice_info?.base_fare, sum, 2.5, "client")
                    : calcClientSum(sum)

                nontaxable = props.data?.client_invoice_info?.driver_charge + props.data?.client_invoice_info?.parking_and_toll + props.data?.client_invoice_info?.miscellaneous
            }
            nontaxable = Math.round((nontaxable) * 100) / 100
            setNonTaxableTotal(nontaxable)
            switch (props.data?.invoice_info?.event) {
                case INVOICE_STATUS.INVOICE_APPROVED:
                case INVOICE_STATUS.INVOICE_CREATED_BY_ORGANIZER:
                case INVOICE_STATUS.INVOICE_CREATED_BY_SUPER_ORGANIZER:
                    setStatus("Approved")
                    setVisible(false)
                    break;
                case INVOICE_STATUS.INVOICE_REJECTED:
                    setStatus("Declined")
                    setVisible(false)
                    break;
                case INVOICE_STATUS.INVOICE_CREATED:
                    setStatus("")
                    break;
                default:
                    break;
            }
        } else {
            setTax(props?.state?.vendor?.tax || 0)
        }
    }, [props.data])

    useEffect(()=>{

        if(props.toCreditNote){
            setInvoiceCost(props.creditNoteData.base_fare || 0);
            setInvoiceExtraDistance(props.creditNoteData.extra_distance_cost || 0);
            setInvoiceExtraHrs(props.creditNoteData.extra_hour_cost || 0);
            setInvoiceDriverBatta(props.creditNoteData.driver_charge || 0);
            setInvoiceParkingTool(props.creditNoteData.parking_and_toll || 0);
            setInvoiceMiscellaneas(props.creditNoteData.miscellaneous || 0);
            // setShowInvoice(true)
            setExtraDistanceQty(props.creditNoteData.extra_kms || 0)
            setExtraDurationQty(props.creditNoteData.extra_hrs || 0)
            setTariffDiscount(props.creditNoteData.discount_percent)
            setTariffDiscountAmt((props.creditNoteData.base_fare * props.creditNoteData.discount_percent) / 100)   
            if(!props.creditNoteData.documents){
                setProofs([])
            }if (props.creditNoteData.documents) {
                setProofs(props.creditNoteData.documents)
            }
        }
    },[])

    const fetchPDF = async (curr_time: any,invoice_type:string) => {
        try {
            const response = await fetch(
                `${BASE_URL}/invoices/client/presigned_url/${props.state.id}?invoice_time=${curr_time}&&invoice_type=${invoice_type}` ,
                {
                    method: "GET",
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("userToken"),
                    },
                },
            );
            const data = await response.json()
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:", data) : "";
                throw new Error('Error fetching Invoice PDF')
            }
            if (data.s3_invoice_url != null) {
                setInvoiceClientPDF(data.s3_invoice_url)
                return "Success"
            } else {
                return data.s3_invoice_url
            }
        } catch (error) {
            console.log(error)
        }
    }

    const handleInvoiceRequest = async () => {
        if (planId != 0) {
            try {
                const formdata = new FormData()
                formdata.append("booking_id", props.state?.id)
                formdata.append("driver_charge", String(invoiceDriverBatta))
                formdata.append("base_fare", String(invoiceCost))
                formdata.append("invoice_amount", String(invoiceSubTotal))
                formdata.append("discount_percent", String(discounts))
                formdata.append("miscellaneous", String(invoiceMiscellaneas))
                formdata.append("parking_and_toll", String(invoiceParkingTool))
                formdata.append("cancellation_amount", String(cancellation))
                // formdata.append("extra_kms_amount", String(extraKmsIncluded != 0 ? kmsCost * extraKms : 0))
                // formdata.append("extra_hrs_amount", String(extraHrsIncluded != 0 ? hrsCost * extraHrs : 0))
                formdata.append("extra_hrs_qty", String(extraDurationQty))
                formdata.append("extra_kms_qty", String(extraDistanceQty))
                formdata.append("extra_kms_amount", String(invoiceExtraDistance))
                formdata.append("extra_hrs_amount", String(invoiceExtraHrs))
                formdata.append("plan_id", String(planId))
                formdata.append("description", description)

                proofs.map((proof: any) => proof ? formdata.append('trip_documents', proof) : null)

                const response = await fetch(`${BASE_URL}/vendors/invoices`, {
                    method: "POST",
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("userToken"),
                    },
                    body: formdata
                })
                const data = await response.json()
                if (!response.ok) {
                    (response.status != 422 && response.status != 500) ? console.log("Error:", data) : "";
                    throw new Error("Error sending invoice to organizer");
                }
            } catch (error) {
                console.log(error)
            }
        } else {
            props?.setAlertType("error");
            props?.setAlertMsg("Please select a package");
            setTimeout(() => {
                props?.setAlertMsg("");
            }, 3000);
        }
    }

    const handleExtraKms = (e: any) => {
        handleDiscountsCancel()
        if (e.target.checked) {
            calcSum((taxableTotal - taxAmnt) + (kmsCost * extraKms))
            setExtraKmsIncluded(extraKms)
            setBaseFare(baseFare + (kmsCost * extraKms))
        } else {
            calcSum((taxableTotal - taxAmnt) - (kmsCost * extraKms))
            setExtraKmsIncluded(0)
            setBaseFare(baseFare - (kmsCost * extraKms))
        }
    }

    const handleExtraHrs = (e: any) => {
        handleDiscountsCancel()
        if (e.target.checked) {
            calcSum((taxableTotal - taxAmnt) + (hrsCost * extraHrs))
            setExtraHrsIncluded(extraHrs)
            setBaseFare(baseFare + (hrsCost * extraHrs))
        } else {
            calcSum((taxableTotal - taxAmnt) - (hrsCost * extraHrs))
            setExtraHrsIncluded(0)
            setBaseFare(baseFare - (hrsCost * extraHrs))
        }
    }

    const handleDiscounts = () => {
        let disc = isVendor == "true" ? discounts : clientDiscount
        let type = isVendor == "true" ? "vendor" : "client"
        if (disc < 0.00 || disc > 100.00) {
            alert("Please enter discount % within 1 to 100")
        } else {
            isVendor == "true" ? calcDiscountedAmount(discounts, baseFare, (taxableTotal - taxAmnt)) : calcDiscountedAmount(clientDiscount, baseFareClient, clientTaxableSubTotal, 2.5, type)
        }
    }

    const handleDiscountsCancel = (dis = false) => {
        setTariffDiscountAmt(0)
        setTariffDiscount(0)
        // dis ? calcSum((taxableTotal - taxAmnt) + discountedAmt, tax, dis) : ""
        setDiscountsIncluded(false)
    }

    const handleClientDiscountsCancel = (dis = false) => {
        dis ? calcClientSum(clientTaxableSubTotal + clientDiscountAmnt) : ""
        setClientDiscountsIncluded(false)
        setClientDiscountAmnt(0)
        setClientDiscount(0)
        setTariffDiscount(0)
        setTariffDiscountAmt(0)
    }

    const handleDataChange = (val: any, type: string) => {
        let prevVal = 0;
        val = parseFloat(val ? val : 0)
        switch (type) {
            case "batta":
                setBatta(val)
                prevVal = batta
                break
            case "miscellaneous":
                setMiscellaneous(val)
                prevVal = miscellaneous
                break
            case "parking":
                setParking(val)
                prevVal = parking
                break
        }
        let nt = (nonTaxableTotal - prevVal) + val
        nt = Math.round((nt) * 100) / 100
        setNonTaxableTotal(nt)
    }
    const handleProofAdd = () => {
        proofs.length < MAX_PROOF_LENGTH ? setProofs([...proofs, null]) : ""
    }

    const handleBaseClient = (e: any) => {
        calcClientSum(parseFloat(e.target.value ? e.target.value : 0) + cancellation)
        setBaseFareClient(parseFloat(e.target.value ? e.target.value : 0))
        handleClientDiscountsCancel()
    }
    const handleBase = (e: any) => {
        calcSum(parseFloat(e.target.value ? e.target.value : 0), tax, true)
        setBaseFare(parseFloat(e.target.value ? e.target.value : 0))
        handleDiscountsCancel()
    }

    const handleAccept = async () => {
        try {
            const response = await fetch(`${BASE_URL}/invoices/approve/${props.state?.id}`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("userToken"),
                }
            })
            const data = await response.json()
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:", data) : "";
                throw new Error("Error accepting invoice");
            }
            setVisible(false)
            setStatus("Approved")
        } catch (error) {
            console.log(error)
        }
    }
    const handleDecline = async () => {
        try {
            const response = await fetch(`${BASE_URL}/invoices/reject/${props.state?.id}`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("userToken"),
                },
                body: JSON.stringify({
                    comment: comments
                })
            })
            const data = await response.json()
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:", data) : "";
                throw new Error("Error declining invoice");
            }
            setVisible(false)
            setDialogOpen(false)
            setStatus("Declined")
        } catch (error) {
            console.log(error)
        }
    }
    const HandleGenerateInvoice = () => {
        (isSuperOrganizer == "0")
            ? setClientInvoiceDialog(true)
            : handleInvoiceToClient()
    }
    const handleInvoiceToClient = async () => {        
        try {
            let formdata = new FormData()
            formdata.append('booking_id', String(props.state?.id))
            // formdata.append('base_fare', String(baseFareClient))
            formdata.append('base_fare', String(invoiceCost))
            // formdata.append('driver_charge', String(batta))
            formdata.append('driver_charge', String(invoiceDriverBatta))
            // formdata.append('taxable_sub_total', String(clientTaxableSubTotal))
            formdata.append('taxable_sub_total', String(invoiceSubTotal))
            // formdata.append('non_taxable_sub_total', String(nonTaxableTotal))
            formdata.append('non_taxable_sub_total', String(invoiceNonTaxableTotal))
            // formdata.append('final_invoice_amount', String(Math.round((clientTaxableTotal + nonTaxableTotal) * 100) / 100))
            formdata.append('final_invoice_amount', String(Math.round((invoiceFinalTotalToClient) * 100) / 100))
            !isPackageSelect ? clientDiscount ? formdata.append('discount_percent', String(clientDiscount)) : "" : clientDiscount ? formdata.append('discount_percent', String(tariffDiscount)) : ""
            // clientDiscount ? formdata.append('discount_percent', String(clientDiscount)) : ""
            // formdata.append('miscellaneous', String(miscellaneous))
            formdata.append('miscellaneous', String(invoiceMiscellaneas))
            // formdata.append('parking_and_toll', String(parking))
            formdata.append('parking_and_toll', String(invoiceParkingTool))
            formdata.append('cancellation_amount', String(cancellation))
            formdata.append('extra_kms', String(extraDistanceQty))
            formdata.append('extra_distance_cost', String(invoiceExtraDistance))
            formdata.append('extra_hrs', String(extraDurationQty))
            formdata.append('extra_duration_cost', String(invoiceExtraHrs))
            // formdata.append('cgst_amount', String(organizerTaxAmnt))
            formdata.append('cgst_amount', String(invoiceCGST))
            // formdata.append('sgst_amount', String(organizerTaxAmnt))
            formdata.append('sgst_amount', String(invoiceSGST))
            // formdata.append('description', description)
            formdata.append('description', clientDescription)
            formdata.append('po_number', poNumber)
            formdata.append('package_id',packageId)
            formdata.append('vehicle_id',vehicleId)

            proofs.map((proof: any) => proof ? formdata.append('trip_documents', proof) : null)

            const response = await fetch(
                `${BASE_URL}/invoices/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("userToken"),
                    },
                    body: formdata,
                },
            );
            const data = await response.json()
            if (!response.ok) {
                (response.status != 422 && response.status != 500) ? console.log("Error:", data) : "";
                throw new Error('Error generating invoice')
            }
            if(data.invoice_document){
                setProofs(data.invoice_document)
                setInvoiceSent(true)
            }
            } catch (error) {
                console.log(error)
            }
            setClientInvoiceDialog(false)
            setBuffer(true)
            isSuperOrganizer == "0" ? setIsTotalEdit(false) : ""
            var curr_time = new Date().toISOString().replace("Z", "").replace("T", " ").split(".")[0]
            
            var tt = setInterval(function () {
                setProgress((prev: any) => prev >= 100 ? 0 : prev + 10)
            }, 1000);

            var down = setInterval(function () {
                downloadInvoice(down, curr_time,"invoices")
            }, 3000);

            setTimeout(function () {
                clearInterval(tt)
                clearInterval(down)
            }, 30000);
    }    

    const handleCreditNote = async () => {
            let formdata = new FormData()
            
            formdata.append('invoice_id',props?.creditNoteData.id)
            formdata.append('base_fare', String(-invoiceCost))
            formdata.append('driver_charge', String(-invoiceDriverBatta))
            formdata.append('taxable_sub_total', String(-invoiceSubTotal))
            formdata.append('non_taxable_sub_total', String(-invoiceNonTaxableTotal))
            formdata.append('final_invoice_amount', String(Math.round(-(invoiceFinalTotalToClient) * 100) / 100))
            formdata.append('cgst_amount', String(-invoiceCGST))
            formdata.append('sgst_amount', String(-invoiceSGST))
            formdata.append('package_id',packageId)
            formdata.append('vehicle_id',vehicleId)
            !isPackageSelect ? clientDiscount ? formdata.append('discount_percent', String(-clientDiscount)) : "" : clientDiscount ? formdata.append('discount_percent', String(-tariffDiscount)) : ""
            formdata.append('cancellation_amount', String(cancellation))
            formdata.append('extra_kms', String(extraDistanceQty))
            formdata.append('extra_hrs', String(extraDurationQty))
            formdata.append('extra_distance_cost', String(-invoiceExtraDistance))
            formdata.append('extra_duration_cost', String(-invoiceExtraHrs))
            formdata.append('po_number', poNumber)            
            formdata.append('description', clientDescription || "")
            formdata.append('miscellaneous', String(-invoiceMiscellaneas))
            formdata.append('parking_and_toll', String(-invoiceParkingTool))
            
            // proofs.map((proof: any) => proof ? formdata.append('trip_documents', proof) : null)
            
                const response = await fetch(
                    `${BASE_URL}/invoices/credit_note`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem("userToken"),
                        },
                        body: formdata,
                    },
                );
                
        
        setBuffer(true)
        isSuperOrganizer == "0" ? setIsTotalEdit(false) : ""
        const curr_time = new Date().toISOString().replace("Z", "").replace("T", " ").split(".")[0]

        var tt = setInterval(function () {
            setProgress((prev: any) => prev >= 100 ? 0 : prev + 10)
        }, 1000);

        var down = setInterval(function () {
            downloadInvoice(down, curr_time,'credit_notes')
        }, 3000);

        setTimeout(function () {
            clearInterval(tt)
            clearInterval(down)
        }, 30000);
    }

    const downloadInvoice = async (down: any, curr_time: string,invoice_type:string) => {
        const status = await fetchPDF(curr_time,invoice_type)
        if (status == "Success") {
            clearInterval(down)
            setBuffer(false)
        }
        return
    }

    function formatNumber(value) {
        return Math.round(value * 100) / 100
    }

    const getPackage = async () => {
        if (props.state.booking_city) {
            const response = await fetch(`${BASE_URL}/tariff_plans?city_id=${props.state.booking_city.id}`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("userToken"),
                }
            })
            const data = await response.json()
            let filteredData = data["tariff_plans"]?.map((item) => {
                return item.package
            })

            setPlanPackage(filteredData)
        }
    }

    async function getPackageWithVehicle(){
        const response = await fetch(`${BASE_URL}/tariff_packages_vehicles?city_id=${props?.state?.booking_city?.id}`,{
            method:'GET',
            headers:{
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("userToken"),
                }
        })

        const data = await response.json()
         
        if(!response.ok){
            setPackageWithVehicle([])
        }
        setPackageWithVehicle(data)
        
    }   

    useEffect(() => {
        getPackageWithVehicle()
        getPackage()
        setIsCity(props.state.booking_city)
        checkInvoice()
        SetDefultPlan()
        getVendorPackage()
    }, [])
    
    async function checkInvoice() {
        if(props.toClient==true){
            const response = await fetch(`${BASE_URL}/invoices/${props?.state?.id}`, {
                method: 'GET',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("userToken"),
                }
            })
            
            const data = await response.json()
            if (response.ok) {
                setInvoiceCost(data.base_fare || 0);
                setInvoiceExtraDistance(data.extra_distance_cost || 0);
                setInvoiceExtraHrs(data.extra_hour_cost || 0);
                setInvoiceDriverBatta(data.driver_charge || 0);
                setInvoiceParkingTool(data.parking_and_toll || 0);
                setInvoiceMiscellaneas(data.miscellaneous || 0);
                setPoNumber(props?.state?.po_number || "");
                setShowInvoice(true)
                setExtraDistanceQty(data.extra_kms || 0)
                setExtraDurationQty(data.extra_hrs || 0)
                setTariffDiscount(data.discount_percent)
                setTariffDiscountAmt((data.base_fare * data.discount_percent) / 100)            
                dispatch(setCreditNoteInvoice(data))
            }
            if (data.documents) {
                setProofs(data?.documents)
                setClientProofsExist(true)
            }
        }
    }


    function clientDiuscount() {
        const discountValue = (invoiceCost * tariffDiscount) / 100;
        setTariffDiscountAmt(discountValue)
    }    

    async function getChoosenPackage(e, value) {        
        const response = await fetch(`${BASE_URL}/invoices/tariff_plan/summary?booking_id=${props.state.id}&package_id=${packageId}&vehicle_id=${value.id}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
            }
        })
        const data = await response.json()
        if (response.ok) {
            setInvoiceCost(data.base_fare)
            setInvoiceExtraDistance(data.extra_distance_cost)
            setInvoiceExtraHrs(data.extra_hour_cost)
            setInvoiceDriverBatta(data.driver_charge)
            setInvoiceParkingTool(data.parking_and_toll)
            setInvoiceMiscellaneas(data.miscellaneous)
            setPoNumber(props?.state?.po_number)
            setTariffDiscount(data.discount_percentage)
            setIsPackageSelect(true)
            handleClientDiscountsCancel(true)
            setExtraDistanceQty(data.extra_kms)
            setExtraDurationQty(data.extra_hrs)
            setInvoiceSent(false)
            setClientProofsExist(false)
            setProofs([])
            setIsVisible(true)
        }        
    }
    const invoiceSubTotal = useMemo(() =>
        (invoiceCost +
            (invoiceExtraDistance * extraDistanceQty) +
            (invoiceExtraHrs * extraDurationQty) +
            invoiceParkingTool +
            invoiceDriverBatta +
            invoiceMiscellaneas) - tariffDiscountAmt,
        [invoiceCost, invoiceExtraDistance, invoiceExtraHrs, invoiceParkingTool, invoiceDriverBatta, invoiceMiscellaneas, extraDistanceQty, extraDurationQty, tariffDiscountAmt]
    )

    const invoiceCGST = useMemo(() => formatNumber(invoiceSubTotal * 0.025), [invoiceSubTotal])
    const invoiceSGST = useMemo(() => formatNumber(invoiceSubTotal * 0.025), [invoiceSubTotal])
    const invoiceTaxableTotal = useMemo(() => formatNumber(invoiceSubTotal + invoiceCGST + invoiceSGST), [invoiceSubTotal, invoiceCGST, invoiceSGST])
    const invoiceFinalTotalToClient = useMemo(() => invoiceTaxableTotal, [invoiceTaxableTotal])

    const fieldValue = (props?.toClient || props?.toCreditNote) ? clientDescription : description;  
    
    async function getVendorPackage() {
        const response = await fetch(`${BASE_URL}/plans/?vendor_id=${props?.state?.vendor.id}&vehicle_id=${props?.state?.plan?.vehicle?.id}`, {
            method: 'GET',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken"),
            }
        })

        const data = await response.json()
        if (response.ok) {
            let filterdData = data.plans.map((item) => {
                const { id, package: packages } = item;
                packages.plan_id = id
                return { id, packages }
            })
            setVendorPackage(filterdData)
        }

    }

    async function SetDefultPlan() {
        if (!props?.toClient && !props.toCreditNote) {
            const response = await fetch(`${BASE_URL}/vendors/bookings/${props?.state?.id}/invoices`, {
                method: 'GET',
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + localStorage.getItem("userToken"),
                }
            })

            const data = await response.json()

            if (response.status == 404) {
                setInvoiceCost(data?.base_fare || 0)
                setInvoiceExtraDistance(data?.extra_kms || 0)
                setExtraDistanceQty(data?.extra_kms_qty || 0)
                setInvoiceExtraHrs(data?.extra_hrs || 0)
                setExtraDurationQty(data?.extra_hrs_qty || 0)
                setInvoiceDriverBatta(data?.driver_charge || 0)
                setInvoiceMiscellaneas(data.miscellaneous || 0)
                setInvoiceParkingTool(data.parking_and_toll || 0)
                setSelectedPackage(data.plan.package || 0)
                setSelectedVehicle(data.plan.vehicle || "")
                setPlanId(data.plan.id || 0)
            }

            setInvoiceCost(data?.base_fare)
            setInvoiceExtraDistance(data?.extra_kms)
            setExtraDistanceQty(data?.extra_kms_qty || 0)
            setInvoiceExtraHrs(data?.extra_hrs)
            setExtraDurationQty(data?.extra_hrs_qty)
            setInvoiceDriverBatta(data?.driver_charge || 0)
            setInvoiceMiscellaneas(data.miscellaneous)
            setInvoiceParkingTool(data.parking_and_toll)
            setSelectedPackage(data.plan.package)
            setPlanId(data.plan.id)
            setSelectedVehicle(data.plan.vehicle)            
            if(props.data.invoice_info.event != INVOICE_STATUS.INVOICE_REJECTED){
                setProofs(data.documents)
            }
        }
    }
    
    async function getPlanSummary(event, value) {
        const response = await fetch(`${BASE_URL}/vendors/bookings/${props?.state?.id}/plan_summary?plan_id=${value?.plan_id}`, {
            method: 'GET',
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: "Bearer " + localStorage.getItem("userToken")
            }
        })

        const data = await response.json()
        if (response.ok) {
            setInvoiceCost(data?.base_fare || 0)
            setInvoiceExtraDistance(data?.extra_kms || 0)
            setExtraDistanceQty(data?.extra_kms_qty || 0)
            setInvoiceExtraHrs(data?.extra_hrs || 0)
            setExtraDurationQty(data?.extra_hrs_qty || 0)
            setInvoiceDriverBatta(data?.driver_batta || 0)
            setInvoiceParkingTool(data?.parking_and_toll || 0)
            setInvoiceMiscellaneas(data?.miscellaneous || 0)
            setPlanId(value.plan_id)
        }
    }

    useEffect(() => {
        if ((isVendor == "true" || props?.isVendor) && props?.data?.invoice_info?.event == "invoice_approved" || props?.data?.invoice_info?.event == "invoice_created") {
            setInvoiceApproved(true)
        }
    })     
    
    function handleInvoiceQty(event){
        const input = event.target.value 

        if(input === '' || /^\d*\.?\d{0,2}$/.test(input)){
            if(event.target.id == "extraDistanceQty"){
                 setExtraDistanceQty(input)
            }
            if(event.target.id == "extraHourQty"){
                setExtraDurationQty(input)
            }
        }
    }

    const handleBlur = (event) => {
        console.log("handle blur ",event.target.id)
        if(event.target.id == "extraHourQty"){
            if (extraDurationQty !== '') {
                const num = parseFloat(extraDurationQty);
                if (!isNaN(num)) {
                    setExtraDurationQty(num.toFixed(2));
                }
            }
        }
        if(event.target.id == "extraDistanceQty"){
            if (extraDistanceQty !== '') {
                const num = parseFloat(extraDistanceQty);
                if (!isNaN(num)) {
                    setExtraDistanceQty(num.toFixed(2));
                }
            }
        }
  };  
  
    return (
        <>
            {props?.toClient && !isCity ?
                <Typography fontSize={20} sx={{ color: "Red" }}>Missing city information in this booking. Kindly update city in edit booking flow</Typography>
                : (props?.toClient || props?.toCreditNote) ?
                <div>
                    <Box className="flex flex-col gap-2 mb-3">
                        <Typography> Select Package</Typography> {/* invoice to client*/}
                        <Autocomplete
                            disablePortal
                            options={packageWithVehicle || []}
                            getOptionLabel={(option) => option?.package?.name}
                            onChange={(event, value) => {setVehicles(value?.vehicles),setPackageId(value?.package?.id)}}
                            sx={{ width: 300 }}
                            renderInput={(params) => (
                                <TextField {...params} label=""
                                />
                            )}
                        />
                    </Box>
                    <Box className="flex flex-col gap-2 mb-3">
                        <Typography> Select Vehicle</Typography>
                        <Autocomplete
                            disablePortal
                            options={vehicles || []}
                            getOptionLabel={(option)=>option.name}
                            onChange={(event,value)=>{getChoosenPackage(event, value),setVehicleId(value.id)}}
                            sx={{ width: 300 }}
                            renderInput={(params) => <TextField {...params} label="" />}
                        />
                    </Box>
                </div> : ""
            }
            <div className="w-100"
                style={props?.toClient && !isCity ? { display: "none" } : {}}
            >
                {(isVendor == "true" || props?.isVendor) &&
                    <>
                        <span className="flex justify-center font-semibold text-base">Include Additional charges (If applicable)</span>
                        <Box className="flex flex-col gap-2 mb-3">
                            <Typography> Select Package</Typography>
                            <Autocomplete
                                disablePortal
                                value={selectedPackage || null}
                                disabled={invoiceApproved}
                                // options={vendorPackage || []}
                                options={vendorPackage.map(item => item?.packages) || []}
                                getOptionLabel={(option) => option.name}
                                onChange={(event, value) => {
                                    getPlanSummary(event, value)
                                    setSelectedPackage(value)
                                }
                                }
                                sx={{ width: 300 }}
                                renderInput={(params) => (
                                    <TextField {...params} label=""
                                    />
                                )}
                            />
                        </Box>
                    </>
                }
                {/* {(props.toClient) ? <div className="flex flex-row justify-end items-end mx-5 my-5">
                    <div className="flex justify-center items-center">
                    <Typography fontSize={18} color={"ActiveCaption"}>PO Number : </Typography>
                    <TextField
                        id="ponumber"
                        variant="standard"
                        value={poNumber}
                        inputProps={{style: { textAlign: 'right' }}}
                        onChange={(e:any)=>setPoNumber(e.target.value)}
                    />
                    </div>
                </div> : ""} */}
                {!props.toClient && !props.toCreditNote && isVendor != "true" && !props?.isVendor ? <div className="">
                    {status && <div className="flex flex-row justify-end items-end">
                        <Typography fontSize={18}>This Invoice has been {status}.</Typography>
                        <Typography fontSize={18}>{(status == "Declined" && props.data?.invoice_info?.comment) ? "Comment: " + props.data?.invoice_info?.comment : ""}</Typography>
                    </div>}
                    <Box className="flex flex-col gap-2 mb-3 align-self: flex-start; ">
                        <Typography> Selected Package</Typography>
                        <Autocomplete
                            disablePortal
                            value={selectedPackage || null}
                            options={selectedPackage ? [selectedPackage] : []}
                            getOptionLabel={(option) => option.name}
                            disabled={true}
                            sx={{ width: 300 }}
                            renderInput={(params) => (
                                <TextField {...params} label="" />
                            )}
                        />
                    </Box>
                    <Box className="flex flex-col gap-2 mb-3">
                        <Typography> Selected Vehicle</Typography>
                        <Autocomplete
                            disablePortal
                            value={selectedVehicle || null}
                            options={selectedVehicle ? [selectedVehicle] : []}
                            getOptionLabel={(option) => option.name}
                            disabled={true}
                            sx={{ width: 300 }}
                            renderInput={(params) => <TextField {...params} label="" />}
                        />
                    </Box>
                </div> : ""}
                <div className="flex flex-col justify-between w-100 mx-5 my-5">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><Typography fontStyle={"italic"} fontSize={20}>Items</Typography></TableCell>
                                <TableCell><Typography align="right" fontStyle={"italic"} fontSize={20}>Cost(Rs)</Typography></TableCell>
                                <TableCell><Typography align="right" fontStyle={"italic"} fontSize={20}>Extras</Typography></TableCell>
                                <TableCell><Typography align="right" fontStyle={"italic"} fontSize={20}>Total</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(!props.toClient && !props.state?.isBookingCancelled && !props.toCreditNote) &&
                                <>
                                    <TableRow>
                                        <TableCell><Typography>Base fare</Typography></TableCell>
                                        <TableCell align="right">
                                            {(isVendor == "true" || props?.isVendor) ? <TextField
                                                id="basefare"
                                                type="number"
                                                variant="standard"
                                                value={invoiceCost}
                                                // disabled={invoiceSent}
                                                disabled={(isVendor == "true" || props?.isVendor) ? invoiceApproved : false}
                                                className="w-16"
                                                inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                                onChange={(e) => setInvoiceCost(parseInt(e.target.value))}
                                            />
                                                : <Typography align="right">{invoiceCost}</Typography>}
                                        </TableCell>
                                        <TableCell colSpan={3}>
                                            <Typography align="right">{invoiceCost}</Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><Typography>Extra kms Cost</Typography></TableCell>
                                        <TableCell align="right">
                                            {(isVendor == "true" || props?.isVendor) ? <TextField
                                                id="extra_kms"
                                                type="number"
                                                variant="standard"
                                                value={invoiceExtraDistance}
                                                // disabled={invoiceSent}
                                                disabled={(isVendor == "true" || props?.isVendor) ? invoiceApproved : false}
                                                className="w-16"
                                                inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                                onChange={(e) => setInvoiceExtraDistance(parseInt(e.target.value))}
                                                // onChange={handleDisctanceQty}
                                            />
                                                : <Typography align="right">{invoiceExtraDistance}</Typography>}
                                        </TableCell>
                                        <TableCell align="right" sx={{ display: "flex" }}>
                                            <TextField
                                                id="extraDistanceQty"
                                                type="text"
                                                variant="standard"
                                                value={extraDistanceQty}
                                                // disabled={invoiceSent}
                                                disabled={(isVendor == "true" || props?.isVendor) ? invoiceApproved : !props.toClient && isVendor != "true" ? true : false}
                                                // label={"Qty"}
                                                // disabled={!isTotalEdit}
                                                className="w-14"
                                                inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                                // onChange={handleBaseClient}
                                                // onChange={(e) => setExtraDistanceQty(parseInt(e.target.value))}
                                                onChange={handleInvoiceQty}
                                                onBlur={handleBlur}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography align="right">{(invoiceExtraDistance * extraDistanceQty).toFixed(2)}</Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><Typography>Extra hrs Cost</Typography></TableCell>
                                        <TableCell align="right">
                                            {(isVendor == "true" || props?.isVendor) ? <TextField
                                                id="extra_hrs"
                                                type="number"
                                                variant="standard"
                                                value={invoiceExtraHrs}
                                                // disabled={invoiceSent}
                                                disabled={(isVendor == "true" || props?.isVendor) ? invoiceApproved : false}
                                                className="w-16"
                                                inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                                onChange={(e) => setInvoiceExtraHrs(parseInt(e.target.value))}
                                            />
                                                : !props.toCreditNote ? <Typography align="right">{invoiceExtraHrs}</Typography> : ""}
                                        </TableCell>
                                        <TableCell align="right" sx={{ display: "flex" }}>
                                            <TextField
                                                id="extraHourQty"
                                                type="text"
                                                variant="standard"
                                                value={extraDurationQty}
                                                // disabled={invoiceSent}
                                                disabled={(isVendor == "true" || props?.isVendor) ? invoiceApproved : !props.toClient && isVendor != "true" ? true : false}
                                                // disabled={!isTotalEdit}
                                                className="w-14"
                                                inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                                // onChange={handleBaseClient}
                                                // onChange={(e) => setExtraDurationQty(parseInt(e.target.value))}
                                                onChange={handleInvoiceQty}
                                                onBlur={handleBlur}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography align="right">{(invoiceExtraHrs * extraDurationQty).toFixed(2)}</Typography>
                                        </TableCell>
                                    </TableRow>
                                </>
                            }
                            {(!props.toClient && discountedAmt !== 0) && <TableRow>
                                <TableCell><Typography fontStyle={"italic"}>Discount on base fare</Typography></TableCell>
                                <TableCell colSpan={3}><Typography align="right" >{"("}{discounts}{"%)   -"}{discountedAmt}</Typography></TableCell>
                            </TableRow>}
                            {props.toClient || props.toCreditNote
                                ? <TableRow>
                                    <TableCell><Typography>Base fare</Typography></TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            id="basefareclient"
                                            type="number"
                                            variant="standard"
                                            // value={baseFareClient}
                                            value={invoiceCost}
                                            // disabled={!isTotalEdit}
                                            className="w-24"
                                            inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                            // onChange={handleBaseClient}
                                            onChange={(e) => setInvoiceCost(parseInt(e.target.value))}
                                        />
                                    </TableCell>
                                    <TableCell colSpan={3}>
                                        <Typography align="right">{invoiceCost * 1}</Typography>
                                    </TableCell>
                                </TableRow> : ""}
                            {props.toClient  || props.toCreditNote
                                ? <TableRow>
                                    <TableCell><Typography>Extra Distance Cost</Typography></TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            id="extraDistanceCost"
                                            type="number"
                                            variant="standard"
                                            value={invoiceExtraDistance}
                                            // disabled={!isTotalEdit}
                                            className="w-24"
                                            inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                            // onChange={handleBaseClient}
                                            onChange={(e) => setInvoiceExtraDistance(parseInt(e.target.value))}

                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ display: "flex" }}>
                                        <TextField
                                            id="extraDistanceQty"
                                            type="text"
                                            variant="standard"
                                            value={extraDistanceQty}
                                            // label={"Qty"}
                                            // disabled={!isTotalEdit}
                                            className="w-14"
                                            inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                            // onChange={handleBaseClient}
                                            // onChange={(e) => setExtraDistanceQty(parseInt(e.target.value))}
                                            onChange={handleInvoiceQty}
                                            onBlur={handleBlur}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography align="right">{(invoiceExtraDistance * extraDistanceQty).toFixed(2)}</Typography>
                                    </TableCell>
                                </TableRow> : ""}
                            {props.toClient  || props.toCreditNote
                                ? <TableRow>
                                    <TableCell><Typography>Extra Duration Cost</Typography></TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            id="extraHourCost"
                                            type="number"
                                            variant="standard"
                                            value={invoiceExtraHrs}
                                            // disabled={!isTotalEdit}
                                            className="w-24"
                                            inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                            // onChange={handleBaseClient}
                                            onChange={(e) => setInvoiceExtraHrs(parseInt(e.target.value))}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ display: "flex" }}>
                                        <TextField
                                            id="extraHourQty"
                                            type="text"
                                            variant="standard"
                                            value={extraDurationQty}
                                            // disabled={!isTotalEdit}
                                            className="w-14"
                                            inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                            // onChange={handleBaseClient}
                                            // onChange={(e) => setExtraDurationQty(parseInt(e.target.value))}
                                            onChange={handleInvoiceQty}
                                            onBlur={handleBlur}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography align="right">{(invoiceExtraHrs * extraDurationQty).toFixed(2)}</Typography>
                                    </TableCell>
                                </TableRow> : ""}

                            {(!props.state?.isBookingCancelled) && <TableRow>
                                <TableCell><Typography>Driver batta</Typography></TableCell>
                                <TableCell align="right">
                                    {((isVendor == "true" || props?.isVendor) || (props.toClient) || (props.toCreditNote))
                                        ? <TextField
                                            id="Driver charges"
                                            type="number"
                                            variant="standard"
                                            size="small"
                                            value={invoiceDriverBatta}
                                            // value={invoiceDriverBatta}
                                            // disabled={(isVendor == "true") ? invoiceSent : false}
                                            disabled={(isVendor == "true" || props?.isVendor) ? invoiceApproved : false}
                                            className="w-24"
                                            inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                            // onChange={(e: any) => handleDataChange(e.target.value, "batta")}
                                            onChange={(e) => setInvoiceDriverBatta(parseInt(e.target.value))}
                                        />
                                        : <Typography align="right">{invoiceDriverBatta}</Typography>}
                                </TableCell>
                                <TableCell colSpan={3}>
                                    <Typography align="right">{invoiceDriverBatta}</Typography>
                                </TableCell>
                            </TableRow>}
                            {(!props.state?.isBookingCancelled) ? <TableRow>
                                <TableCell><Typography>Parking & Toll</Typography></TableCell>
                                <TableCell align="right">
                                    {((isVendor == "true" || props?.isVendor) || (props.toClient) || (props.toCreditNote)) ? <TextField
                                        id="parking"
                                        type="number"
                                        variant="standard"
                                        // value={parking}
                                        value={props?.toClient ? invoiceParkingTool : invoiceParkingTool}
                                        // disabled={(isVendor == "true") ? invoiceSent : false}
                                        disabled={(isVendor == "true" || props?.isVendor) ? invoiceApproved : false}
                                        className="w-24"
                                        inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                        // onChange={(e: any) => handleDataChange(e.target.value, "parking")}
                                        onChange={(e) => setInvoiceParkingTool(parseInt(e.target.value))}
                                    />
                                        : <Typography align="right">{invoiceParkingTool}</Typography>}
                                </TableCell>
                                <TableCell colSpan={3}>
                                    <Typography align="right">{props?.toClient ? invoiceParkingTool : invoiceParkingTool}</Typography>
                                </TableCell>
                            </TableRow> : ""}
                            {(!props.state?.isBookingCancelled) ? <TableRow>
                                <TableCell><Typography>Miscellaneous</Typography></TableCell>
                                <TableCell align="right">
                                    {((isVendor == "true" || props?.isVendor) || (props.toClient) || (props.toCreditNote)) ? <TextField
                                        id="miscellaneous"
                                        type="number"
                                        variant="standard"
                                        // value={miscellaneous}
                                        value={invoiceMiscellaneas}
                                        // disabled={(isVendor == "true") ? invoiceSent : false}
                                        disabled={(isVendor == "true" || props?.isVendor) ? invoiceApproved : false}
                                        className="w-24"
                                        inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                        // onChange={(e: any) => handleDataChange(e.target.value, "miscellaneous")}
                                        onChange={(e) => setInvoiceMiscellaneas(parseInt(e.target.value))}
                                    />
                                        : <Typography align="right">{invoiceMiscellaneas}</Typography>}
                                </TableCell>
                                <TableCell colSpan={3}>
                                    <Typography align="right">{props?.toClient ? invoiceMiscellaneas : invoiceMiscellaneas}</Typography>
                                </TableCell>
                            </TableRow> : ""}
                            {/* {(props.toClient && clientDiscountAmnt != 0) && !isPackageSelect && <TableRow>
                                <TableCell><Typography>Discount</Typography></TableCell>
                                <TableCell colSpan={3}><Typography align="right">{"("}{!isPackageSelect ? clientDiscount : tariffDiscount}{"%)   -"}{!isPackageSelect ? clientDiscountAmnt : tariffDiscountAmt}</Typography></TableCell>
                            </TableRow>} */}
                            {((props.toClient || props.toCreditNote) && tariffDiscountAmt != 0) && <TableRow>
                                <TableCell><Typography>Discount</Typography></TableCell>
                                <TableCell colSpan={3}><Typography align="right">{"("}{tariffDiscount}{"%)   -"}{tariffDiscountAmt}</Typography></TableCell>
                            </TableRow>}
                            {(props.state?.isBookingCancelled) && <TableRow>
                                <TableCell><Typography>Cancellation Fee(Rs.)</Typography></TableCell>
                                <TableCell align="right">
                                    {(isVendor == "true" || props.toClient || props?.isVendor) ? <TextField
                                        id="cancellation"
                                        type="number"
                                        variant="standard"
                                        value={cancellation}
                                        // disabled={isVendor == "true" ? invoiceSent : false}
                                        className="w-24"
                                        inputProps={{ style: { textAlign: 'right' }, min: 0 }}
                                        onChange={(e: any) => {
                                            let val = parseFloat(e.target.value)
                                            setCancellation(val)
                                            isVendor == "true" ? calcSum(val, tax, true) : calcClientSum(baseFareClient + val)
                                        }}
                                    />
                                        : <Typography align="right">{cancellation}</Typography>}
                                </TableCell>
                            </TableRow>}
                            {(!props.toVendor) && (isVendor != "true" && !props?.isVendor) && <TableRow>
                                <TableCell colSpan={3} align="right"><Typography>Taxable Sub-Total</Typography></TableCell>
                                <TableCell><Typography align="right">
                                    {Math.round((props.toClient ? invoiceSubTotal : invoiceSubTotal) * 100) / 100}
                                    {/* {invoiceSubTotal} */}
                                </Typography></TableCell>
                            </TableRow>}
                            {/* {!props.toClient && <TableRow>
                                <TableCell colSpan={3}><Typography align="right">Tax</Typography></TableCell>
                                <TableCell><Typography align="right" >{"("}{!invoiceCost ? 0 : tax}{"%)   "}{!invoiceCost ? 0 : taxAmnt}</Typography></TableCell>
                            </TableRow>} */}
                            {(!props.toVendor) && (isVendor != "true" && !props?.isVendor) && <TableRow>
                                <TableCell colSpan={3} align="right"><Typography>CGST</Typography></TableCell>
                                <TableCell><Typography align="right">
                                    {"("}{2.5}{"%)   "}
                                    {/* {organizerTaxAmnt} */}
                                    {invoiceCGST}
                                </Typography></TableCell>
                            </TableRow>}
                            {(!props.toVendor) && (isVendor != "true" && !props?.isVendor) &&  <TableRow>
                                <TableCell colSpan={3} align="right"><Typography>SGST</Typography></TableCell>
                                <TableCell><Typography align="right">
                                    {"("}{2.5}{"%)   "}
                                    {/* {organizerTaxAmnt} */}
                                    {invoiceSGST}
                                </Typography></TableCell>
                            </TableRow>}
                            {!props.toVendor && (isVendor != "true" && !props?.isVendor) && <TableRow>
                                <TableCell colSpan={3} align="right"><Typography>Taxable Total</Typography></TableCell>
                                <TableCell><Typography align="right">
                                    {props.toClient ?
                                        //  clientTaxableTotal 
                                        invoiceTaxableTotal
                                        : invoiceTaxableTotal}
                                </Typography></TableCell>
                            </TableRow>}

                            {/* {(nonTaxableTotal != 0) && <TableRow>
                                <TableCell align="right"><Typography>Non-Taxable Total</Typography></TableCell>
                                <TableCell><Typography align="right">
                                     {nonTaxableTotal}
                                    {invoiceNonTaxableTotal}
                                </Typography></TableCell>
                            </TableRow>} */}

                            {!props.toClient  && !props.toCreditNote && <TableRow>
                                <TableCell colSpan={3}><Typography align="right" fontSize={20}>Grand Total</Typography></TableCell>
                                <TableCell><Typography align="right" fontSize={20}>{Math.round((invoiceSubTotal) * 100) / 100}</Typography></TableCell>
                            </TableRow>}
                            {(props.toClient || props.toCreditNote) && <TableRow>
                                <TableCell colSpan={2}><Typography fontSize={20} color={"indianred"} align="right">Final Total to Client</Typography></TableCell>
                                <TableCell colSpan={3}><Typography align="right" fontSize={20}>
                                    {/* {Math.round((clientTaxableTotal + nonTaxableTotal) * 100) / 100} */}
                                    {Math.round((invoiceFinalTotalToClient) * 100) / 100}
                                </Typography></TableCell>
                            </TableRow>}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-col  w-100">
                        {(!props.toClient ? (isVendor == "false" && !invoiceSent && !props.state?.isBookingCancelled) : isVendor == "false" ||
                            // (props.toClient && isTotalEdit)) 
                            showInvoice) || props.toCreditNote
                            ?
                            <div>
                                {((props.toClient && !clientDiscount && !clientDiscountsIncluded)|| props.toCreditNote) &&
                                     <div className="flex justify-start mx-5 my-5">
                                        <FormGroup>
                                            <Button color="primary" onClick={() => {
                                                isVendor == "true" ? setDiscountsIncluded(true) : setClientDiscountsIncluded(true)
                                            }}
                                            >{"Add Discount"}<DiscountIcon /></Button>
                                        </FormGroup>
                                    </div>} 
                                {((isVendor == "true" && (discountsIncluded || discounts)) || ((props.toClient || props.toCreditNote) && (clientDiscount || clientDiscountsIncluded)))
                                    ? <div className="flex justify-end items-baseline flex-row mx-5 my-5">
                                        <TextField
                                            variant="standard"
                                            value={isVendor == "true" ? discounts : clientDiscount}
                                            inputProps={{
                                                style: { textAlign: 'right' },
                                                min: 0
                                            }}
                                            onChange={(e) => {
                                                isVendor == "true" ? setDiscounts(parseFloat(e.target.value)) : setClientDiscount(parseFloat(e.target.value))
                                                setTariffDiscount(e.target.value)
                                            }}
                                            disabled={isVendor == "true" ? discountedAmt != 0 : clientDiscountAmnt != 0}
                                            label={"Discount Percentage"}
                                            type="number"
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <PercentIcon />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        ></TextField>
                                        <Button color="primary" onClick={() => clientDiuscount()} disabled={isVendor == "true" ? discountedAmt != 0 : clientDiscountAmnt != 0}>{"Apply"}</Button>
                                        <Button color="primary"
                                            onClick={() => { isVendor == "true" ? handleDiscountsCancel(true) : handleClientDiscountsCancel(true) }}
                                        >{"Cancel"}</Button>
                                    </div> : ""}
                            </div>
                            : ""}
                        {(((isVendor == "true" && !invoiceSent) || props.toClient) || props.toCreditNote)? <div className="flex justify-start mx-5 my-5">
                            <TextField
                                multiline
                                maxRows={Infinity}
                                rows={4}
                                className="w-80"
                                label="Invoice Description"
                                placeholder="Add parking, toll, miscellaneous or cancellation fee breakdown"
                                value={fieldValue}
                                onChange={(e: any) => (props?.toClient || props.toCreditNote) ? setClientDescription(e.target.value) : setDescription(e.target.value)}
                            >
                            </TextField>
                        </div> : (!props.toClient && description) ? <div className="flex flex-col justify-start mx-5 my-5 w-80 max-h-52">
                            <span>
                                <Typography fontSize={18}>Invoice Description</Typography>
                            </span>
                            <div className=" w-full overflow-y-auto">
                                {description}
                            </div>
                        </div> : ""}
                    </div>
                    <div className="flex flex-col justify-end">
                        <div>
                            {/* {(isVendor == "true" && discountedAmt) ? <Typography fontSize={18}>{discounts}% Discount added</Typography> : ""}
                            {(isVendor == "true" && extraKmsIncluded && invoiceSent) ? <Typography fontSize={18}>Extra kms charge included</Typography> : ""}
                            {(isVendor == "true" && extraHrsIncluded && invoiceSent) ? <Typography fontSize={18}>Extra hrs charge included</Typography> : ""} */}
                        </div>
                        {/* {(isVendor == "true" && (extraHrs || extraKms)) ? <div>
                            <FormGroup>
                                {(extraKms && !invoiceSent) ? <FormControlLabel control={<CheckBox checked={extraKmsIncluded !== 0} />} label={kmsText} onClick={handleExtraKms} /> : ""}
                                {(extraHrs && !invoiceSent) ? <FormControlLabel control={<CheckBox checked={extraHrsIncluded !== 0} />} label={hrsText} onClick={handleExtraHrs} /> : ""}
                            </FormGroup>
                        </div> : ""} */}
                    </div>
                </div>
                {
                // isVendor == "true" && 
                !invoiceSent && !props.toVendor && !props.toCreditNote && !clientProofsExist && isVisible ? 
                <div>
                    <div className="flex flex-row justify-center items-center m-5">
                        <Typography fontSize={18}>Add Supporting Documents (Optional) </Typography>
                        <IconButton
                            color="info"
                            onClick={handleProofAdd}
                        >
                            <AddCircle />
                        </IconButton>
                    </div>
                    <div className="flex flex-col items-center justify-between  m-2">
                        {proofs &&
                            proofs.map((proof: any, index: number) => (
                                <div className="m-4 w-80 h-10">
                                    {
                                        !proof
                                            ? <div className="flex justify-center items-center flex-row">
                                                <input
                                                    accept="image/*,application/pdf"
                                                    id="icon-button-photo"
                                                    onChange={(e: any) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            if (e.target.files[0].size > MAX_FILE_SIZE) {
                                                                setProofError(true)
                                                                return false;
                                                            }
                                                            const temp = [...proofs]
                                                            temp[index] = e.target.files[0]
                                                            setProofs(temp)
                                                            setProofError(false)
                                                        }
                                                    }}
                                                    type="file"
                                                    style={{ display: 'none', }}
                                                    capture
                                                />
                                                <label htmlFor="icon-button-photo">
                                                    <IconButton component="span">
                                                        <AddRoundedIcon fontSize="large" />
                                                    </IconButton>
                                                </label>
                                                <Typography>Proof {index + 1}</Typography>
                                            </div>
                                            : <div className="flex justify-between">
                                                <img className="w-20 h-10" src={URL.createObjectURL(proof)} alt="proof" />
                                                <Typography>{proof.name}</Typography>
                                                <IconButton onClick={() => {
                                                    const temp = [...proofs]
                                                    temp.splice(index, 1)
                                                    setProofs(temp)
                                                }}><Close /></IconButton>
                                            </div>
                                    }
                                </div>
                            ))
                        }
                    </div>
                </div>
                    :!props.toCreditNote && <div className="flex flex-row items-center justify-center  m-2">
                        {proofs &&
                            proofs.map((proof: any, index: number) => (
                                proof ? <div className="m-2 flex justify-center">
                                    <a
                                        href={proof}
                                        target="_blank"
                                        download
                                    >
                                        <IconButton color="info">{`DOC ${index + 1}`}<DownloadRoundedIcon /></IconButton>
                                    </a>
                                </div> : ""
                            ))
                        }
                    </div>}
                {rejectedDocs.length != 0 && <div className="flex flex-row items-center justify-center  m-2">
                    <Typography>Existing Docs</Typography>
                    {
                        rejectedDocs.map((proof: any, index: number) => (
                            <div className="m-2 flex justify-center">
                                <a
                                    href={proof}
                                    target="_blank"
                                    download
                                >
                                    <IconButton color="info">{`DOC ${index + 1}`}<DownloadRoundedIcon /></IconButton>
                                </a>
                            </div>
                        ))
                    }
                </div>}
                {proofError && <div className="flex justify-center items-center m-5">
                    <Typography color={"indianred"}>*Maximum file size of 5 MB is allowed</Typography>
                </div>}
                <div className="flex justify-center">
                    {(isVendor == "true" || props?.isVendor)
                        ? <Button variant="contained" sx={{ bgcolor: "#02ca72" }}
                           disabled={invoiceApproved || (!selectedPackage || invoiceSent)}
                            onClick={()=>{handleInvoiceRequest(),setInvoiceSent(true)}}>{"Send Invoice to Organizer"}</Button>
                        : (props.toClient || props.toCreditNote)
                            ? <div>
                                <div className="flex flex-row">
                                    <Button variant="contained" sx={{ bgcolor: "#02ca72" }}
                                        // disabled={!isTotalEdit || buffer} 
                                        disabled={!vehicleId || !isVisible}
                                        onClick={()=>{ !props.toCreditNote ? HandleGenerateInvoice() : handleCreditNote(),setIsVisible(false)}}>{!props.toCreditNote ? "Generate Invoice": "Generate Credit Note"}</Button>
                                    <Dialog onClose={() => setClientInvoiceDialog(false)} open={clientInvoiceDialog}>
                                        <DialogTitle>You won't be able to generate invoice again for the same booking. Do you wish to continue?</DialogTitle>
                                        <div className="flex flex-row justify-center">
                                            <Button variant="contained" color="inherit" sx={{ m: 2 }} onClick={() => setClientInvoiceDialog(false)}>Cancel</Button>
                                            <Button variant="contained" color="success" sx={{ m: 2 }} onClick={handleInvoiceToClient}>Proceed</Button>
                                        </div>
                                    </Dialog>
                                    <div className="ml-5">
                                        {buffer
                                            ? <CircularProgress variant="determinate" value={progress} />
                                            : invoiceClientPDF && <a
                                                href={invoiceClientPDF}
                                                download
                                                target="_blank"
                                            >
                                                <IconButton color="info">Invoice<DownloadRoundedIcon /></IconButton>
                                            </a>}
                                    </div>
                                </div>
                            </div>
                            : !props?.isVendor && <div className="flex justify-center items-center">
                                {visible && <div>
                                    <Button variant="contained" color="success" sx={{ m: 2, bgcolor: "#02ca72" }} onClick={handleAccept}>Accept</Button>
                                    <Button variant="contained" color="error" sx={{ m: 2, bgcolor: "#e2302d" }} onClick={() => setDialogOpen(true)}>Decline</Button>
                                    <Dialog onClose={() => setDialogOpen(false)} open={dialogOpen}>
                                        <DialogTitle>Enter reason for declining</DialogTitle>
                                        <TextField
                                            id="reason"
                                            label="Comments"
                                            InputProps={{ className: "m-3" }}
                                            value={comments}
                                            onChange={(e) => setComments(e.target.value)}
                                        />
                                        <Button variant="contained" color="error" sx={{ m: 2 }} onClick={handleDecline}>Decline</Button>
                                    </Dialog>
                                </div>}
                            </div>
                    }
                </div>
            </div>
        </>
    )
}

export default Invoice
