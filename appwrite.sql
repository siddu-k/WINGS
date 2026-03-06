-- This SQL schema represents the structure for your Appwrite collection.
-- In the Appwrite console, you would create a collection (e.g., 'registrations')
-- and then add each of these columns as an attribute with the specified type.

CREATE TABLE registrations (
    -- Appwrite automatically handles the primary key ($id), but this is for representation.
    id VARCHAR(255) PRIMARY KEY,
    shortId VARCHAR(5) NOT NULL, -- New 5-digit ID for easy lookup
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    college VARCHAR(255) NOT NULL,
    department VARCHAR(50) NOT NULL,
    year VARCHAR(20) NOT NULL,
    events JSON NOT NULL, -- In Appwrite, use a String attribute and store the JSON array.
    participationType VARCHAR(20) NOT NULL,
    teamName VARCHAR(255),
    teammate2 VARCHAR(255),
    teammate3 VARCHAR(255),
    projectTopic TEXT,
    projectAbstractFileId VARCHAR(255), -- To store the ID of the uploaded file from Appwrite Storage.
    paymentReference VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    attended BOOLEAN NOT NULL DEFAULT FALSE -- New attendance tracking
);