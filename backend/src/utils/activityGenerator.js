/**
 * activityGenerator.js
 *
 * Pure function — formats raw DB event objects into human-readable
 * activity description strings. No database calls.
 *
 * Activity event types:
 *   EXPENSE_CREATED  | EXPENSE_UPDATED  | EXPENSE_DELETED
 *   SETTLEMENT_CREATED | MEMBER_ADDED | MEMBER_REMOVED
 */

const ACTIVITY_TYPES = {
  EXPENSE_CREATED: 'EXPENSE_CREATED',
  EXPENSE_UPDATED: 'EXPENSE_UPDATED',
  EXPENSE_DELETED: 'EXPENSE_DELETED',
  SETTLEMENT_CREATED: 'SETTLEMENT_CREATED',
  MEMBER_ADDED: 'MEMBER_ADDED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
};

/**
 * Format a number as a currency string.
 * @param {number|string} amount
 * @returns {string} e.g. "₹1,200.00"
 */
function formatAmount(amount) {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate a human-readable description from a raw activity event.
 *
 * @param {object} event
 * @param {string} event.type - One of ACTIVITY_TYPES
 * @param {string} event.actorName - Name of the user who triggered the event
 * @param {string} [event.targetName] - Name of the affected user (for settlements/member events)
 * @param {string} [event.expenseTitle] - Title of the expense (for expense events)
 * @param {number|string} [event.amount] - Amount (for expense/settlement events)
 * @param {string} event.groupName - Name of the group
 *
 * @returns {string} Human-readable activity string
 */
function generateActivityDescription(event) {
  const { type, actorName, targetName, expenseTitle, amount, groupName } = event;

  switch (type) {
    case ACTIVITY_TYPES.EXPENSE_CREATED:
      return `${actorName} added "${expenseTitle}" ${formatAmount(amount)} in ${groupName}`;

    case ACTIVITY_TYPES.EXPENSE_UPDATED:
      return `${actorName} updated "${expenseTitle}" in ${groupName}`;

    case ACTIVITY_TYPES.EXPENSE_DELETED:
      return `${actorName} deleted "${expenseTitle}" in ${groupName}`;

    case ACTIVITY_TYPES.SETTLEMENT_CREATED:
      return `${actorName} settled ${formatAmount(amount)} with ${targetName} in ${groupName}`;

    case ACTIVITY_TYPES.MEMBER_ADDED:
      return `${targetName} was added to ${groupName}`;

    case ACTIVITY_TYPES.MEMBER_REMOVED:
      return `${targetName} left ${groupName}`;

    default:
      return `Activity in ${groupName}`;
  }
}

/**
 * Transform an array of raw activity events into formatted activity objects
 * ready for the API response.
 *
 * @param {object[]} events - Raw events from DB queries
 * @returns {{ type: string, description: string, groupName: string, createdAt: string }[]}
 */
function generateActivityFeed(events) {
  return events.map((event) => ({
    type: event.type,
    description: generateActivityDescription(event),
    groupName: event.groupName,
    createdAt: event.createdAt,
  }));
}

module.exports = { generateActivityFeed, generateActivityDescription, ACTIVITY_TYPES, formatAmount };
