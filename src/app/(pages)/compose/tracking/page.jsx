"use client";
import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
} from "@heroui/react";

const ITEMS_PER_PAGE = 100;

const Tracking = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageStates, setPageStates] = useState({}); // key: campaignId, value: page number

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/handleTracking", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch data");
        }

        const result = await res.json();

        if (result.error) {
          throw new Error(result.error);
        }

        setCampaigns(result.emailRecord);

        // Initialize page states
        const initialPageStates = {};
        result.emailRecord.forEach((c) => {
          initialPageStates[c._id] = 1;
        });
        setPageStates(initialPageStates);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handlePageChange = (campaignId, newPage) => {
    setPageStates((prev) => ({ ...prev, [campaignId]: newPage }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Email Tracking</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && campaigns.length === 0 && (
        <p>No email records found.</p>
      )}

      {!loading &&
        !error &&
        campaigns.map((campaign) => {
          const currentPage = pageStates[campaign._id] || 1;
          const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
          const paginatedEmails = campaign.emails.slice(
            startIndex,
            startIndex + ITEMS_PER_PAGE
          );
          const totalPages = Math.ceil(campaign.emails.length / ITEMS_PER_PAGE);

          return (
            <div key={campaign._id} className="mb-10">
              <h2 className="text-lg font-semibold mb-2">
                {campaign.campaignName}
              </h2>
              <Table aria-label="Email Tracking Table">
                <TableHeader>
                  <TableColumn>#</TableColumn>
                  <TableColumn>Email</TableColumn>
                  <TableColumn>Is Sent</TableColumn>
                  <TableColumn>Timestamp</TableColumn>
                </TableHeader>
                <TableBody>
                  {paginatedEmails.map((emailObj, index) => (
                    <TableRow key={index}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell>{emailObj.email}</TableCell>
                      <TableCell>
                        {emailObj.isSent ? "✅ Yes" : "❌ No"}
                      </TableCell>
                      <TableCell>
                        {emailObj.timestamp
                          ? new Date(emailObj.timestamp).toLocaleString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    total={totalPages}
                    initialPage={currentPage}
                    page={currentPage}
                    onChange={(page) => handlePageChange(campaign._id, page)}
                  />
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default Tracking;
