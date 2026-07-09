import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

function CustomCard({
  cardIcon,
  cardEvent,
  cardEventCount,
  handleUrlChange,
}: any) {
  return (
    <>
      <div className="md:w-full md:flex md:justify-around w-full">
        <Link
          underline="none"
          onClick={handleUrlChange} 
          sx={{ cursor: "pointer" }}
        >
          <Card
            variant="outlined"
            sx={{
              backgroundColor: "#F8FAFC",
              width: 261,
              height: 120,
            }}
          >
            <React.Fragment>
              <CardContent className={`w-full h-full`}>
                <div className="flex w-full h-full flex-col justify-between gap-1.5">
                  <Typography sx={{ fontSize: "15px" }} component="div">
                    {cardEvent}
                  </Typography>
                  <div className="w-full flex justify-between items-center px-1">
                    <Typography variant="h4" component="div" sx={{paddingLeft:2}}>
                      {cardEventCount}
                    </Typography>
                    <img
                      src={cardIcon}
                      alt="cab-request"
                      className="w-[30%] h-full"
                    />
                  </div>
                </div>
              </CardContent>
            </React.Fragment>
          </Card>
        </Link>
      </div>
    </>
  );
}

export default CustomCard;
