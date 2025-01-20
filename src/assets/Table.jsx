import React, { useState, useEffect } from "react";
import { getCachedData, fetchSampleData } from "../cacheUtils";

const Table = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("");
  const [checkedItems, setCheckedItems] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
      } else {
        const fetchedData = await fetchSampleData();
        setData(fetchedData);
      }
    };

    loadData();

    // Optional: Periodic refresh every 24 hours
    const interval = setInterval(async () => {
      const fetchedData = await fetchSampleData();
      setData(fetchedData);
    }, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const handleCheck = (item) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const filteredData = data.filter(
    (item) =>
      (item.Instructor?.toLowerCase() || "").includes(filter.toLowerCase()) ||
      (item.ClassCode?.toLowerCase() || "").includes(filter.toLowerCase()) ||
      (item.CourseTitle?.toLowerCase() || "").includes(filter.toLowerCase())
  );

  const sortedData = [
    ...checkedItems,
    ...filteredData.filter((item) => !checkedItems.includes(item)),
  ];

  return (
    <div style={{ width: "80%", margin: "0 auto" }}>
      <input
        type="text"
        placeholder="Search by Instructor, Class, or Title"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="search-bar"
      />
      <table className="table" border="1">
        <thead>
          <tr>
            <th>Check</th>
            <th>Class Code</th>
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
            <tr key={index} className="table-row">
              <td>
                <input
                  type="checkbox"
                  checked={checkedItems.includes(item)}
                  onChange={() => handleCheck(item)}
                />
              </td>
              <td>{item.ClassCode}</td>
              <td>{item.CourseTitle}</td>
              <td>{item.Instructor}</td>
              <td>{item.Day}</td>
              <td>{item.Date}</td>
              <td>{item.StartTime}</td>
              <td>{item.EndTime}</td>
              <td>{item.Room}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
