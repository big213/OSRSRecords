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
