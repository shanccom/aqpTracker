import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import Rutas from "../pages/Rutas/Rutas";
import Topbar from "../components/TopBar/TopBar";
import Foro from "../pages/Foro/Foro";
import Perfil from "../pages/Perfil/Perfil";


export default function AppRouter() {
    return (
            <div className="">
                <Topbar/>
                    <Routes>
                        <Route path="/" element={<Home/>} />
                        <Route path="/Rutas" element={<Rutas/>} />
                        <Route path="/Foro" element={<Foro />} />
                        <Route path="/Perfil" element={<Perfil />} />
                    </Routes>
            </div>
    )
}



