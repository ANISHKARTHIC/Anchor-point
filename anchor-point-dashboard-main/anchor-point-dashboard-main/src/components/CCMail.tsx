import { Button, Chip, TextField } from "@mui/material"
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";
import { isValidEmail } from "../utils/utils";


interface CCMailProps {
  emailIds: any,
  setEmailIds: (data: any) => void,
  disabled: boolean
  }
  
  const CCMail: React.FC<CCMailProps> = ({
    emailIds,
    setEmailIds,
    disabled,
  }) => {

    const [email,setEmail] = useState("")
    const [error,setError] = useState(false)

    const addEmailCC = async() => {
      setError(false)
      setEmailIds([...emailIds,email])
      setEmail("")
    }

    return(
      <div>
        <div className="flex flex-wrap justify-center gap-1 items-center rounded">
          <div className="flex flex-row mt-1">
                <TextField
                  value={email}
                  placeholder="e.g: someone@gmail.com"
                  onChange={(e:any)=>{
                    setEmail(e.target.value)
                  }}
                  size="small"
                  disabled={disabled}
                  error={error}
                  helperText={error ? "Enter a valid email" : ""}
                />
                <Button disabled={disabled} onClick={()=>{
                  isValidEmail(email) ? addEmailCC() : setError(true)
                }}><AddIcon/></Button>
              </div>
            {emailIds?.map((type:any)=>(
              <Chip label={type} sx={{bgcolor:"#F8FAFC"}} onDelete={()=>{
                let temp = [...emailIds]
                const index = emailIds.indexOf(type) 
                index > -1 ? temp.splice(index,1) : ""
                setEmailIds([...temp])
              }}></Chip>
            ))}
          </div>
      </div>
    )
  }

export default CCMail
