import SettingsBar from "../components/SettingsBar";
import AddCityForm from "../components/AddCityForm";
import AddModelForm from "../components/AddModelForm";
import AddCostCenter from "../components/AddCostCenter";
import { useState } from "react";

export default function Settings() {

  const [settingToBeDisplayed,setSettingToBeDisplayed] = useState(0)
  
  return (
    <div className="w-full h-screen items-center flex-col md:flex-row bg-appBg flex">
      <div className="flex-1">
        <SettingsBar setSettingToBeDisplayed={setSettingToBeDisplayed} />
      </div>
      <div className="flex w-full m-5 bg-pink justify-start items-start">
        {settingToBeDisplayed == 0 
          ? <AddCityForm /> 
          : settingToBeDisplayed == 1
            ? <AddModelForm/>
            : <AddCostCenter/>}
      </div>
    </div>
  );
}
