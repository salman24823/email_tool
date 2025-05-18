// app/layout.js
import { ToastContainer } from "react-toastify";
import SideBar from "./components/sideBar";
import "./globals.css";
import SessionWrapper from "./components/SessionWrapper/page";

export const metadata = {
  title: "Email Campaign Tool",
  description: "Upload CSV and send bulk emails with interval",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        <SessionWrapper>
          <div id="Main" className="">
            <main >{children}</main>
          </div>
          <ToastContainer />
        </SessionWrapper>
      </body>
    </html>
  );
}
