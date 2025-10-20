import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Rutas from "../pages/Rutas/Rutas";
import Topbar from "../components/TopBar/TopBar";


export default function AppRouter() {
    return (
        <Router>
            <div className="">
                <Topbar/>
                    <Routes>
                        <Route path="/" element={<Home/>} />
                        <Route path="/Rutas" element={<Rutas/>} />
                    </Routes>
            </div>
        </Router>
    )
}   



