import SideBar from "@/app/components/sideBar";
import React from "react";

const layout = ({ children }) => {
  return (
    <div className="grid grid-cols-12">
      <SideBar />
      <div className="col-span-10">{children}</div>
    </div>
  );
};

export default layout;
