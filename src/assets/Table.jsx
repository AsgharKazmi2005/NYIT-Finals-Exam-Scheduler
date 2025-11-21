import React, { useState, useEffect, useMemo } from "react";
import { getCachedData, fetchSampleData } from "../cacheUtils";

// Convert backend keys → frontend keys
const normalizeRow = (row) => ({
  ClassCode: row.Class ?? "",
  CourseTitle: row.Course_Title ?? "",
  Instructor: row.Instructor ?? "",
  Date: row.Date ?? "",
  StartTime: row.Start_Time ?? "",
  EndTime: row.End_Time ?? "",
  Room: row["Building_&_Room"] ?? "",
  Campus: row.Campus ?? "",
});

// Convert "5:00 PM" → minutes since midnight
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;

  const [time, meridian] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (meridian === "PM" && hours !== 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const Table = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("");
  const [checkedItems, setCheckedItems] = useState([]);
  const [sortConfigList, setSortConfigList] = useState([]);
  const [campusFilters, setCampusFilters] = useState({
    "New York City": true,
    "Long Island": true,
  });

  // Time is NOT sortable anymore
  const sortableColumns = [
    "ClassCode",
    "Instructor",
    "CourseTitle",
    "Date",
  ];

  useEffect(() => {
    const loadData = async () => {
      const cachedData = getCachedData();
      const raw = cachedData ? cachedData : await fetchSampleData();
      const normalized = raw.map(normalizeRow);
      setData(normalized);
    };
    loadData();
  }, []);

  const handleCheck = (item) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const requestSort = (key) => {
    if (!sortableColumns.includes(key)) return; // TIME is unsortable

    setSortConfigList((prevList) => {
      const existingIndex = prevList.findIndex((entry) => entry.key === key);

      if (existingIndex !== -1) {
        const current = prevList[existingIndex];
        const newDirection = current.direction === "asc" ? "desc" : "asc";
        const updatedList = [...prevList];
        updatedList[existingIndex] = { ...current, direction: newDirection };
        return updatedList;
      } else {
        return [...prevList, { key, direction: "asc" }];
      }
    });
  };

  const resetFilters = () => {
    setFilter("");
    setSortConfigList([]);
    setCheckedItems([]);
    setCampusFilters({
      "New York City": true,
      "Long Island": true,
    });
  };

  const getSortArrow = (key) => {
    if (!sortableColumns.includes(key)) return ""; // TIME gets NO arrow

    const config = sortConfigList.find((c) => c.key === key);
    if (!config) return "⇅";
    return config.direction === "asc" ? "⬆️" : "⬇️";
  };

  // Filtering logic
  const filteredData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const safeFilter = (filter || "").toLowerCase();

    return data.filter((item) => {
      const instructor = (item.Instructor ?? "").toLowerCase();
      const classCode = (item.ClassCode ?? "").toLowerCase();
      const courseTitle = (item.CourseTitle ?? "").toLowerCase();
      const campus = item.Campus ?? "";

      const matchesSearch =
        instructor.includes(safeFilter) ||
        classCode.includes(safeFilter) ||
        courseTitle.includes(safeFilter);

      const campusAllowed = campusFilters[campus];

      return matchesSearch && campusAllowed;
    });
  }, [data, filter, campusFilters]);

  // Sorting logic (DATE automatically sorts by TIME)
  const sortedFilteredData = useMemo(() => {
    const sortable = [...filteredData];

    if (sortConfigList.length > 0) {
      sortable.sort((a, b) => {
        for (const { key, direction } of sortConfigList) {
          let aVal = a[key] ?? "";
          let bVal = b[key] ?? "";

          if (key === "Date") {
            // PRIMARY: Date sorting
            const aDate = new Date(aVal);
            const bDate = new Date(bVal);
            if (aDate < bDate) return direction === "asc" ? -1 : 1;
            if (aDate > bDate) return direction === "asc" ? 1 : -1;

            // SECONDARY: Start Time sorting
            const aTime = parseTimeToMinutes(a.StartTime);
            const bTime = parseTimeToMinutes(b.StartTime);
            if (aTime < bTime) return direction === "asc" ? -1 : 1;
            if (aTime > bTime) return direction === "asc" ? 1 : -1;

            // TERTIARY: End Time sorting if needed
            const aEnd = parseTimeToMinutes(a.EndTime);
            const bEnd = parseTimeToMinutes(b.EndTime);
            if (aEnd < bEnd) return direction === "asc" ? -1 : 1;
            if (aEnd > bEnd) return direction === "asc" ? 1 : -1;
          }

          // Normal string sorting for Instructor, ClassCode, CourseTitle
          aVal = aVal.toString().toLowerCase();
          bVal = bVal.toString().toLowerCase();

          if (aVal < bVal) return direction === "asc" ? -1 : 1;
          if (aVal > bVal) return direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortable;
  }, [filteredData, sortConfigList]);

  const sortedData = [
    ...checkedItems,
    ...sortedFilteredData.filter((item) => !checkedItems.includes(item)),
  ];

  return (
    <div style={{ margin: "0 auto" }}>
      <p style={{ fontSize: "0.8rem", marginBottom: "1rem", color: "#ccc" }}>
        <em>Developed by NYIT ACM</em>
      </p>

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
        &nbsp;&nbsp;
        <button onClick={resetFilters}>Reset All Filters</button>
      </div>

      <p>
        <em>🔁 Click a column header to sort (times follow date automatically)</em>
      </p>

      <table className="table" border="1">
        <thead>
          <tr>
            <th>Check</th>

            <th onClick={() => requestSort("ClassCode")} style={{ cursor: "pointer" }}>
              Class Code {getSortArrow("ClassCode")}
            </th>

            <th onClick={() => requestSort("CourseTitle")} style={{ cursor: "pointer" }}>
              Course Title {getSortArrow("CourseTitle")}
            </th>

            <th onClick={() => requestSort("Instructor")} style={{ cursor: "pointer" }}>
              Instructor {getSortArrow("Instructor")}
            </th>

            <th onClick={() => requestSort("Date")} style={{ cursor: "pointer" }}>
              Date {getSortArrow("Date")}
            </th>

            <th>Start Time</th>
            <th>End Time</th>

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
