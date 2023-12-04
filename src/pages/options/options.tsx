import "../index.css";
import OptionsApp from "./OptionsApp";
import React from "react";
import ReactDOM from "react-dom/client";



const root = document.getElementById("root") as HTMLDivElement;
ReactDOM.createRoot(root).render(
    <React.StrictMode>
        <OptionsApp />
    </React.StrictMode>
);
