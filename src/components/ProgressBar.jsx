import React from "react";
import "../style/ProgressBar.css";

const ProgressBar = ({ label, value = 0, color = "purple" }) => {
  const width = Math.min(value * 20, 300);

  return (
    <div className="progress-container">
      <p className="progress-label">{label}</p>
      <div className="progress-bar-bg">
        <div
          className={`progress-bar-fill ${color}`}
          style={{ width: `${width}px` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
