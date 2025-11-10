interface LocalRideEmailParams {
  rideName: string;
  rideUrl: string;
  rideDate: string;
  rideTime: string;
  rideDifficulty: string;
  distanceMiles: number;
  radiusMiles: number;
  location?: string | null;
  hostName?: string | null;
  referralUrl: string;
}

function renderInfoRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 6px 0; font-size: 14px; color: #4b5563;">
        <span style="font-weight: 600; color: #111827;">${label}:</span>
        ${value}
      </td>
    </tr>
  `;
}

export function renderLocalRideEmail({
  rideName,
  rideUrl,
  rideDate,
  rideTime,
  rideDifficulty,
  distanceMiles,
  radiusMiles,
  location,
  hostName,
  referralUrl,
}: LocalRideEmailParams) {
  const safeDistance = distanceMiles.toFixed(1);
  const safeRadius = radiusMiles.toFixed(0);
  const displayLocation = location?.trim() || "Location shared on ride page";
  const displayHost = hostName?.trim() || "Local rider";

  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; background-color: #f9fafb; padding: 24px 0;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto; width: 100%; max-width: 520px; background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;">
            <tr>
              <td style="text-align: left;">
                <p style="margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 600; color: #10b981;">
                  New ride near you
                </p>
                <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 32px; font-weight: 700; color: #111827;">
                  ${rideName}
                </h1>
                <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #4b5563;">
                  A group ride has been created within ${safeDistance} miles of your saved location. You’re receiving this alert because your distance preference is set to ${safeRadius} miles.
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                  ${renderInfoRow("Date", rideDate)}
                  ${renderInfoRow("Time", rideTime)}
                  ${renderInfoRow("Difficulty", rideDifficulty)}
                  ${renderInfoRow("Approx. distance from you", `${safeDistance} miles`)}
                  ${renderInfoRow("Location", displayLocation)}
                  ${renderInfoRow("Host", displayHost)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 0;">
                <a
                  href="${rideUrl}"
                  style="
                    display: inline-block;
                    background: linear-gradient(135deg, #059669, #10b981);
                    color: #ffffff;
                    text-decoration: none;
                    font-weight: 600;
                    padding: 12px 24px;
                    border-radius: 9999px;
                    box-shadow: 0 10px 20px rgba(5, 150, 105, 0.25);
                    text-align: center;
                    font-size: 14px;
                  "
                >
                  View ride details
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 16px;">
                <p style="margin: 0 0 12px; font-size: 13px; color: #4b5563; font-weight: 600;">
                  Know someone who would love this ride?
                </p>
                <a
                  href="mailto:?subject=Join%20me%20for%20${encodeURIComponent(rideName)}&body=There%27s%20a%20great%20ride%20happening%20soon.%20Check%20it%20out%3A%20${encodeURIComponent(referralUrl)}"
                  style="
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border-radius: 9999px;
                    border: 1px solid #d1d5db;
                    color: #111827;
                    font-size: 13px;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.2s ease;
                  "
                >
                  Invite a friend
                </a>
              </td>
            </tr>
            <tr>
              <td style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af;">
                  Don’t want these emails anymore? Update your notification settings from your profile page.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

interface RideCancelledEmailParams {
  rideName: string;
  rideDate: string;
  rideTime: string;
  hostName?: string | null;
  notes?: string | null;
  ridesUrl: string;
}

export function renderRideCancelledEmail({
  rideName,
  rideDate,
  rideTime,
  hostName,
  notes,
  ridesUrl,
}: RideCancelledEmailParams) {
  const safeHost = hostName?.trim() || "The ride host";
  const additionalNotes = notes?.trim();

  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; background-color: #f9fafb; padding: 24px 0;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto; width: 100%; max-width: 520px; background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;">
            <tr>
              <td>
                <p style="margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 600; color: #ef4444;">
                  Ride cancelled
                </p>
                <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 32px; font-weight: 700; color: #111827;">
                  ${rideName}
                </h1>
                <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #4b5563;">
                  ${safeHost} has cancelled this group ride. We wanted to let you know as soon as possible so you can adjust your plans.
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                  ${renderInfoRow("Original date", rideDate)}
                  ${renderInfoRow("Original time", rideTime)}
                </table>
              </td>
            </tr>
            ${
              additionalNotes
                ? `<tr>
                    <td style="padding: 16px 0 0;">
                      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 16px;">
                        <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #111827;">
                          Message from ${safeHost}
                        </p>
                        <p style="margin: 0; font-size: 13px; line-height: 20px; color: #4b5563;">
                          ${additionalNotes.replace(/\n/g, "<br />")}
                        </p>
                      </div>
                    </td>
                  </tr>`
                : ""
            }
            <tr>
              <td style="padding: 24px 0;">
                <a
                  href="${ridesUrl}"
                  style="
                    display: inline-block;
                    background: linear-gradient(135deg, #0ea5e9, #38bdf8);
                    color: #ffffff;
                    text-decoration: none;
                    font-weight: 600;
                    padding: 12px 24px;
                    border-radius: 9999px;
                    box-shadow: 0 10px 20px rgba(14, 165, 233, 0.25);
                    text-align: center;
                    font-size: 14px;
                  "
                >
                  Browse other rides
                </a>
              </td>
            </tr>
            <tr>
              <td style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af;">
                  You are receiving this email because you RSVP’d to this ride. We’ll always keep you informed of schedule changes.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

