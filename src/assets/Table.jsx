import React, { useState } from "react";
import sampleData from "../sampleData";

const Table = () => {
  const [filter, setFilter] = useState("");
  const [checkedItems, setCheckedItems] = useState([]);

  const handleCheck = (item) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const filteredData = sampleData.filter(
    (item) =>
      item.instructor.toLowerCase().includes(filter.toLowerCase()) ||
      item.class.toLowerCase().includes(filter.toLowerCase()) ||
      item.courseTitle.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedData = [
    ...checkedItems,
    ...filteredData.filter((item) => !checkedItems.includes(item)),
  ];

  return (
    <div style={{ width: "80%", margin: "0 auto" }}>
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by Instructor, Class, or Title"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="search-bar"
      />

      {/* Exam Table */}
      <table className="table" border="1">
        <thead>
          <tr>
            <th>Check</th>
            <th>Class</th>
            <th>Course Title</th>
            <th>Instructor</th>
            <th>Day</th>
            <th>Date</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Room</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr key={item.id} className="table-row">
              <td>
                <input
                  type="checkbox"
                  checked={checkedItems.includes(item)}
                  onChange={() => handleCheck(item)}
                />
              </td>
              <td>{item.class}</td>
              <td>{item.courseTitle}</td>
              <td>{item.instructor}</td>
              <td>{item.day}</td>
              <td>{item.date}</td>
              <td>{item.startTime}</td>
              <td>{item.endTime}</td>
              <td>{item.room}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
