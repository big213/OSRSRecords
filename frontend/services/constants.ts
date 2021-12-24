export const submissionStatusArray = [
  {
    index: 1,
    name: 'SUBMITTED',
    text: 'Submitted',
    color: 'orange',
  },
  {
    index: 2,
    name: 'UNDER_REVIEW',
    text: 'Under Review',
    color: 'yellow',
  },
  {
    index: 3,
    name: 'APPROVED',
    text: 'Approved',
    color: 'green',
  },
  {
    index: 4,
    name: 'INFORMATION_REQUESTED',
    text: 'Information Requested',
    color: 'purple',
  },
  {
    index: 5,
    name: 'REJECTED',
    text: 'Rejected',
    color: 'red',
  },
]

export const submissionStatusMap = submissionStatusArray.reduce(
  (total, val) => {
    total[val.index] = val
    total[val.name] = val
    return total
  },
  {}
)

export const participantsTextMap = {
  '1': 'Solo',
  '2': 'Duo',
  '3': 'Trio',
}

export const placeEmojisMap = {
  '1': {
    emoji: '🥇',
    text: '1st Place',
  },
  '2': {
    emoji: '🥈',
    text: '2nd Place',
  },
  '3': {
    emoji: '🥉',
    text: '3rd Place',
  },
}
