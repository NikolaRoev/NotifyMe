import "../index.css";
import PopupApp from "./PopupApp";
import React from "react";
import ReactDOM from "react-dom/client";



const root = document.getElementById("root") as HTMLDivElement;
ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <PopupApp />
    </React.StrictMode>
);
