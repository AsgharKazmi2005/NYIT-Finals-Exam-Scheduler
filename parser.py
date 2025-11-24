import pandas as pd
import json
import sys

# Ensure UTF-8 printing on Windows (safe no-op on Mac/Linux)
sys.stdout.reconfigure(encoding='utf-8')

CSV_PATH = "schedule.csv"

def load_clean_csv(csv_path):
    # Load raw CSV (don’t infer header)
    df = pd.read_csv(csv_path, header=None, dtype=str, keep_default_na=False)

    # Find the header row: the row where first cell == "Session"
    header_index = None
    for i, row in df.iterrows():
        if str(row[0]).strip() == "Session":
            header_index = i
            break

    if header_index is None:
        raise ValueError("Could not find the header row (Session, Class, etc.)")

    # Extract header
    headers = df.iloc[header_index].tolist()
    headers = [h.strip().replace(" ", "_") for h in headers]

    # Trim all rows above header
    df = df.iloc[header_index+1:]

    # Apply header to dataframe
    df.columns = headers

    # Drop rows where "Class" column is empty
    df = df[df["Class"].str.strip() != ""]

    return df


def df_to_json(df):
    records = df.to_dict(orient="records")
    return records


if __name__ == "__main__":
    df = load_clean_csv(CSV_PATH)
    json_data = df_to_json(df)

    with open("output.json", "w", encoding="utf-8") as f:
        json.dump(json_data, f, indent=4, ensure_ascii=False)

    print(f"Extracted {len(json_data)} valid rows -> saved to output.json")
