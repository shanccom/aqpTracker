import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from '../components/Sidebar/Sidebar'

import Home from "../pages/Home/Home";
import Rutas from "../pages/Rutas/Rutas";


export default function AppRouter() {
    return (
        <Router>
            <div className="flex h-screen">
                <Sidebar/>
                <div className="flex-1 p-6">
                    <Routes>
                        <Route path="/" element={<Home/>} />
                        <Route path="/Rutas" element={<Rutas/>} />
                    </Routes>
                </div>
            </div>
        </Router>
    )
}   



