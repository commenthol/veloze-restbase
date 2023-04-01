export const dbItemsSchema = {
  type: 'object',
  required: [
    'item'
  ],
  properties: {
    item: {
      type: 'string'
    },
    quantity: {
      type: 'integer',
      minimum: 0,
      maximum: 10e3
    },
    height: {
      type: 'number',
      minimum: 0
    },
    width: {
      type: 'number',
      minimum: 0
    },
    unit: {
      type: 'string',
      enum: ['cm', 'in'],
      default: 'cm'
    },
    status: {
      type: 'string',
      enum: ['A', 'D']
    },
    createdAt: {
      type: 'string',
      format: 'date-time'
    }
  }
}

export const dbItems = [
  { item: 'journal', quantity: 25, height: 14, width: 21, unit: 'cm', status: 'A' },
  { item: 'notebook', quantity: 50, height: 9, width: 11, unit: 'in', status: 'A' },
  { item: 'paper', quantity: 100, height: 8.5, width: 11, unit: 'in', status: 'D' },
  { item: 'planner', quantity: 75, height: 22.85, width: 30, unit: 'cm', status: 'D' },
  { item: 'postcard', quantity: 45, height: 10, width: 15.25, unit: 'cm', status: 'A' }
]
