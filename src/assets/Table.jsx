import React, { useState, useEffect } from "react";
import { gapi } from "gapi-script";
import { getCachedData, fetchSampleData } from "../cacheUtils";

const Table = () => {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState("");
  const [checkedItems, setCheckedItems] = useState([]);
  const [tokenClient, setTokenClient] = useState(null);

  const CLIENT_ID = import.meta.env.VITE_GAPI_CLIENT_ID;
  const API_KEY = import.meta.env.VITE_GAPI_API_KEY;

  useEffect(() => {
    // Load GAPI client
    gapi.load("client", async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
        ],
      });
    });

    // Initialize Google Identity Services token client
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/calendar.events",
      callback: (response) => {
        if (response.error) {
          console.error("Token error:", response.error);
          alert("Failed to authenticate. Please try again.");
        } else {
          console.log("Token acquired:", response);
        }
      },
    });

    setTokenClient(client);

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
  }, [API_KEY, CLIENT_ID]);

  const handleCheck = (item) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const sanitizeDate = (date) => {
    if (!date || typeof date !== "string") {
      throw new Error(`Invalid date value: ${date}`);
    }

    // Handle MM/DD/YYYY or other formats
    const [month, day, year] = date.split("/");
    if (month && day && year) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    // If already in YYYY-MM-DD format
    const [yearPart, monthPart, dayPart] = date.split("-");
    if (yearPart && monthPart && dayPart) {
      return `${yearPart}-${monthPart.padStart(2, "0")}-${dayPart.padStart(
        2,
        "0"
      )}`;
    }

    throw new Error(`Malformed date value: ${date}`);
  };

  const sanitizeTime = (time) => {
    if (!time || typeof time !== "string") {
      throw new Error(`Invalid time value: ${time}`);
    }

    // Handle 12-hour time format with AM/PM
    const match = time.match(/(\d+):(\d+)\s?(AM|PM)/i);
    if (match) {
      let [_, hours, minutes, period] = match;
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);

      if (period.toUpperCase() === "PM" && hours < 12) {
        hours += 12; // Convert PM to 24-hour format
      }
      if (period.toUpperCase() === "AM" && hours === 12) {
        hours = 0; // Convert midnight to 00:00
      }

      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    }

    throw new Error(`Malformed time value: ${time}`);
  };

  const sendToGoogleCalendar = async () => {
    try {
      // Request the access token
      await new Promise((resolve, reject) => {
        tokenClient.callback = (response) => {
          if (response.error) {
            reject(new Error(`Token error: ${response.error}`));
          } else {
            console.log("Token acquired:", response);
            resolve(response);
          }
        };
        tokenClient.requestAccessToken({ prompt: "" });
      });

      // Once the token is acquired, process the events
      const events = checkedItems.map((item) => {
        const sanitizedDate = sanitizeDate(item.Date);
        const sanitizedStartTime = sanitizeTime(item.StartTime);
        const sanitizedEndTime = sanitizeTime(item.EndTime);

        const startDateTime = new Date(
          `${sanitizedDate}T${sanitizedStartTime}`
        );
        const endDateTime = new Date(`${sanitizedDate}T${sanitizedEndTime}`);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          throw new Error(
            `Invalid date or time format for item: ${JSON.stringify(item)}`
          );
        }

        return {
          summary: item.CourseTitle,
          location: item.Room,
          description: `Class: ${item.ClassCode} - Instructor: ${item.Instructor}`,
          start: {
            dateTime: startDateTime.toISOString(),
          },
          end: {
            dateTime: endDateTime.toISOString(),
          },
        };
      });

      for (const event of events) {
        await gapi.client.calendar.events.insert({
          calendarId: "primary",
          resource: event,
        });
      }

      alert("Events added to your Google Calendar!");
    } catch (error) {
      console.error("Error adding events:", error);
      alert(`Failed to add events to Google Calendar. Error: ${error.message}`);
    }
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
      <button
        className="google-calendar"
        onClick={sendToGoogleCalendar}
        style={{ margin: "10px 0" }}
      >
        Save Checked Classes to Google Calendar
      </button>
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
