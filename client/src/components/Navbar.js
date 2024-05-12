import React from "react";

const Navbar = ({ handleRunClick, selectedLanguage }) => {
    const handleLanguageChange = (e) => {
        selectedLanguage(e.target.value); // Update the selected language state
    };

    return (
        <div className="navbar">
            <select onChange={(e) => handleLanguageChange(e)}>
                <option disabled>Select Language</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
            </select>
            <button type="submit" onClick={handleRunClick}>Run</button>
        </div>
    );
};

export default Navbar;
