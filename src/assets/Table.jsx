import React, { useState, useEffect, useMemo } from "react";
import { getCachedData, fetchSampleData } from "../cacheUtils";

const Table = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("");
  const [checkedItems, setCheckedItems] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [campusFilters, setCampusFilters] = useState({
    "New York City": true,
    "Long Island": true,
  });

  const sortableColumns = [
    "ClassCode",
    "Instructor",
    "CourseTitle",
    "Day",
    "Date",
    "StartTime",
    "EndTime",
  ];

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
  }, []);

  const handleCheck = (item) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "⬆️" : "⬇️";
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const safeFilter = (filter || "").toLowerCase();

    return data.filter((item) => {
      const instructor = (item.Instructor ?? "").toString().toLowerCase();
      const classCode = (item.ClassCode ?? "").toString().toLowerCase();
      const courseTitle = (item.CourseTitle ?? "").toString().toLowerCase();
      const campus = item.Campus || "";

      const matchesSearch =
        instructor.includes(safeFilter) ||
        classCode.includes(safeFilter) ||
        courseTitle.includes(safeFilter);

      const campusAllowed = campusFilters[campus];

      return matchesSearch && campusAllowed;
    });
  }, [data, filter, campusFilters]);

  const sortedFilteredData = useMemo(() => {
    const sortable = [...filteredData];

    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key] ?? "";
        let bVal = b[sortConfig.key] ?? "";

        if (sortConfig.key.toLowerCase().includes("time")) {
          aVal = new Date(`1970-01-01T${aVal}`);
          bVal = new Date(`1970-01-01T${bVal}`);
        } else if (sortConfig.key.toLowerCase().includes("date")) {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        } else {
          aVal = aVal.toString().toLowerCase();
          bVal = bVal.toString().toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return sortable;
  }, [filteredData, sortConfig]);

  const sortedData = [
    ...checkedItems,
    ...sortedFilteredData.filter((item) => !checkedItems.includes(item)),
  ];

  return (
    <div style={{ margin: "0 auto" }}>
      <input
        type="text"
        placeholder="Search by Instructor, Class, or Title"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="search-bar"
      />

      <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
        <label>
          <input
            type="checkbox"
            checked={campusFilters["New York City"]}
            onChange={() =>
              setCampusFilters((prev) => ({
                ...prev,
                "New York City": !prev["New York City"],
              }))
            }
          />
          New York City
        </label>
        &nbsp;&nbsp;
        <label>
          <input
            type="checkbox"
            checked={campusFilters["Long Island"]}
            onChange={() =>
              setCampusFilters((prev) => ({
                ...prev,
                "Long Island": !prev["Long Island"],
              }))
            }
          />
          Long Island
        </label>
      </div>

      <p>
        <em>🔁 Click a column header to sort (only columns with arrows are sortable)</em>
      </p>

      <table className="table" border="1">
        <thead>
          <tr>
            <th>Check</th>
            <th
              onClick={() => requestSort("ClassCode")}
              style={{ cursor: "pointer" }}
            >
              Class Code {getSortArrow("ClassCode")}
            </th>
            <th
              onClick={() => requestSort("CourseTitle")}
              style={{ cursor: "pointer" }}
            >
              Course Title {getSortArrow("CourseTitle")}
            </th>
            <th
              onClick={() => requestSort("Instructor")}
              style={{ cursor: "pointer" }}
            >
              Instructor {getSortArrow("Instructor")}
            </th>
            <th
              onClick={() => requestSort("Day")}
              style={{ cursor: "pointer" }}
            >
              Day {getSortArrow("Day")}
            </th>
            <th
              onClick={() => requestSort("Date")}
              style={{ cursor: "pointer" }}
            >
              Date {getSortArrow("Date")}
            </th>
            <th
              onClick={() => requestSort("StartTime")}
              style={{ cursor: "pointer" }}
            >
              Start Time {getSortArrow("StartTime")}
            </th>
            <th
              onClick={() => requestSort("EndTime")}
              style={{ cursor: "pointer" }}
            >
              End Time {getSortArrow("EndTime")}
            </th>
            <th>Room</th>
            <th>Campus</th>
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
              <td>{item.Campus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
