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

interface PasswordResetEmailParams {
  recipientName?: string | null;
  resetUrl: string;
  expiresMinutes: number;
}

export function renderPasswordResetEmail({
  recipientName,
  resetUrl,
  expiresMinutes,
}: PasswordResetEmailParams) {
  const greetingName = recipientName?.trim() || "there";

  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; background-color: #f9fafb; padding: 24px 0;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto; width: 100%; max-width: 520px; background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;">
            <tr>
              <td>
                <p style="margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 600; color: #6366f1;">
                  Password reset requested
                </p>
                <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 32px; font-weight: 700; color: #111827;">
                  Hi ${greetingName},
                </h1>
                <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #4b5563;">
                  We received a request to reset the password for your MTB Group Ride account. If you made this request, click the button below to choose a new password. This link will expire in ${expiresMinutes} minutes.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0 24px;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 9999px; text-align: center; font-size: 14px;">
                  Reset your password
                </a>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin: 0 0 16px; font-size: 13px; line-height: 20px; color: #6b7280;">
                  If you didn’t request a password reset, you can safely ignore this email—your password will remain the same.
                </p>
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af;">
                  For security, this link can only be used once. If it expires, you can request a new password reset from the login page.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

interface RideMessageEmailParams {
  rideName: string;
  rideUrl: string;
  senderName: string;
  snippet: string;
  totalUnread: number;
}

export function renderRideMessageEmail({
  rideName,
  rideUrl,
  senderName,
  snippet,
  totalUnread,
}: RideMessageEmailParams) {
  const safeSnippet = snippet.trim();
  const unreadLabel =
    totalUnread > 1
      ? `${totalUnread} new messages`
      : "1 new message";

  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; background-color: #f9fafb; padding: 24px 0;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto; width: 100%; max-width: 520px; background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;">
            <tr>
              <td>
                <p style="margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 600; color: #0f172a;">
                  ${unreadLabel}
                </p>
                <h1 style="margin: 0 0 12px; font-size: 24px; line-height: 32px; font-weight: 700; color: #111827;">
                  New activity in ${rideName}
                </h1>
                <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #4b5563;">
                  ${senderName} just posted a message about this ride. Tap below to read it and keep the conversation going.
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <div style="border-left: 4px solid #10b981; padding-left: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 13px; line-height: 20px; color: #1f2937;">
                    ${safeSnippet}
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <a
                  href="${rideUrl}"
                  style="
                    display: inline-block;
                    background: linear-gradient(135deg, #10b981, #34d399);
                    color: #ffffff;
                    text-decoration: none;
                    font-weight: 600;
                    padding: 12px 24px;
                    border-radius: 9999px;
                    box-shadow: 0 10px 20px rgba(16, 185, 129, 0.25);
                    text-align: center;
                    font-size: 14px;
                  "
                >
                  View ride conversation
                </a>
              </td>
            </tr>
            <tr>
              <td style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af;">
                  You’re receiving this email because you’re part of this ride. We’ll only nudge you if there’s been no new activity for 24 hours.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

interface DirectMessageEmailParams {
  senderName: string;
  senderProfileUrl: string;
  snippet: string;
  inboxUrl: string;
  totalUnreadFromSender: number;
}

export function renderDirectMessageEmail({
  senderName,
  senderProfileUrl,
  snippet,
  inboxUrl,
  totalUnreadFromSender,
}: DirectMessageEmailParams) {
  const safeSnippet = snippet.trim();
  const unreadLabel =
    totalUnreadFromSender > 1
      ? `${totalUnreadFromSender} new messages`
      : "1 new message";

  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; background-color: #f9fafb; padding: 24px 0;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto; width: 100%; max-width: 520px; background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;">
            <tr>
              <td>
                <p style="margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 600; color: #0f172a;">
                  ${unreadLabel}
                </p>
                <h1 style="margin: 0 0 12px; font-size: 24px; line-height: 32px; font-weight: 700; color: #111827;">
                  ${senderName} sent you a message
                </h1>
                <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #4b5563;">
                  Connect directly with fellow riders. Reply now to keep the conversation moving.
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <div style="border-left: 4px solid #6366f1; padding-left: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; font-size: 13px; line-height: 20px; color: #1f2937;">
                    ${safeSnippet}
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                  <a
                    href="${inboxUrl}"
                    style="
                      display: inline-block;
                      background: linear-gradient(135deg, #4f46e5, #6366f1);
                      color: #ffffff;
                      text-decoration: none;
                      font-weight: 600;
                      padding: 12px 24px;
                      border-radius: 9999px;
                      box-shadow: 0 10px 20px rgba(99, 102, 241, 0.25);
                      text-align: center;
                      font-size: 14px;
                    "
                  >
                    Open your inbox
                  </a>
                  <a
                    href="${senderProfileUrl}"
                    style="
                      display: inline-block;
                      border: 1px solid #d1d5db;
                      color: #111827;
                      text-decoration: none;
                      font-weight: 600;
                      padding: 12px 24px;
                      border-radius: 9999px;
                      font-size: 14px;
                    "
                  >
                    View ${senderName}'s profile
                  </a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af;">
                  We’ll only email you if you haven’t heard from this rider in the last 24 hours. Reply to stop these reminders automatically.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

interface RidePostponedEmailParams {
  rideName: string;
  rideDate: string;
  rideTime: string;
  hostName?: string | null;
  notes?: string | null;
  rideUrl: string;
}

export function renderRidePostponedEmail({
  rideName,
  rideDate,
  rideTime,
  hostName,
  notes,
  rideUrl,
}: RidePostponedEmailParams) {
  const safeHost = hostName?.trim() || "The ride host";
  const additionalNotes = notes?.trim();

  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; background-color: #f9fafb; padding: 24px 0;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto; width: 100%; max-width: 520px; background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;">
            <tr>
              <td>
                <p style="margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 600; color: #f59e0b;">
                  Ride postponed
                </p>
                <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 32px; font-weight: 700; color: #111827;">
                  ${rideName}
                </h1>
                <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #4b5563;">
                  ${safeHost} has postponed this group ride. The ride is still active, but the scheduled date/time may need to be updated. Check the ride page for the latest information.
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
                      <div style="background-color: #fef3c7; border-radius: 12px; padding: 16px; border-left: 4px solid #f59e0b;">
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
                  href="${rideUrl}"
                  style="
                    display: inline-block;
                    background: linear-gradient(135deg, #f59e0b, #fbbf24);
                    color: #ffffff;
                    text-decoration: none;
                    font-weight: 600;
                    padding: 12px 24px;
                    border-radius: 9999px;
                    box-shadow: 0 10px 20px rgba(245, 158, 11, 0.25);
                    text-align: center;
                    font-size: 14px;
                  "
                >
                  View ride details
                </a>
              </td>
            </tr>
            <tr>
              <td style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af;">
                  You are receiving this email because you RSVP'd to this ride. We'll always keep you informed of schedule changes.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

interface HostJoinEmailParams {
  hostName: string;
  attendeeName: string;
  rideName: string;
  rideDate: string;
  rideTime: string;
  rideUrl: string;
  attendeeCount: number;
}

export function renderHostJoinEmail({
  hostName,
  attendeeName,
  rideName,
  rideDate,
  rideTime,
  rideUrl,
  attendeeCount,
}: HostJoinEmailParams) {
  const safeHost = hostName || "Ride host";
  const safeRideName = rideName || "Your ride";
  const attendeeSummary =
    attendeeCount === 1
      ? "1 rider is attending"
      : `${attendeeCount} riders are attending`;

  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; background-color: #f9fafb; padding: 24px 0;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 auto; width: 100%; max-width: 520px; background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08); font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;">
            <tr>
              <td>
                <p style="margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 600; color: #0f172a;">
                  New attendee
                </p>
                <h1 style="margin: 0 0 12px; font-size: 24px; line-height: 32px; font-weight: 700; color: #111827;">
                  ${attendeeName} joined ${safeRideName}
                </h1>
                <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #4b5563;">
                  Great news — your ride has a new attendee. Here&apos;s the latest:
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                  ${renderInfoRow("Ride", safeRideName)}
                  ${renderInfoRow("Date", rideDate)}
                  ${renderInfoRow("Time", rideTime)}
                  ${renderInfoRow("Attendees", attendeeSummary)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 0;">
                <a
                  href="${rideUrl}"
                  style="
                    display: inline-block;
                    background: linear-gradient(135deg, #10b981, #34d399);
                    color: #ffffff;
                    text-decoration: none;
                    font-weight: 600;
                    padding: 12px 24px;
                    border-radius: 9999px;
                    box-shadow: 0 10px 20px rgba(16, 185, 129, 0.25);
                    text-align: center;
                    font-size: 14px;
                  "
                >
                  View ride roster
                </a>
              </td>
            </tr>
            <tr>
              <td style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #9ca3af;">
                  We&apos;ll only email you about new attendees if it&apos;s been 24 hours since the last update. Manage notifications anytime from your profile.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

