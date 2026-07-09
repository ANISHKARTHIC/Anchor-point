import { Alert, Snackbar } from "@mui/material";
import Slide, { SlideProps } from "@mui/material/Slide"
import { useState } from "react";

function Toast({
    message,
    toastType,
}: any) {
    const [open,setOpen] = useState(true)

    const transition = (props: SlideProps) => {
        return <Slide {...props} direction="down" />
    }

    const handleClose = () => {
        setOpen(false)
    }

    return (
        <Snackbar
            sx={{ width: "320px", marginTop: 7 }}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            autoHideDuration={5000}
            TransitionComponent={transition}
        >
            <Alert
                onClose={handleClose}
                severity={toastType}
                sx={{ width: "100%" }}
            >
                {message}
            </Alert>
        </Snackbar>
    )
}

export default Toast;
