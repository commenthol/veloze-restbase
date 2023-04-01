import assert from 'node:assert'
import { DataTypes } from 'sequelize'
import { schemaToModel } from '../../src/adapters/SqlAdapter.js'

describe('adapters/SqlAdapter', function () {
  describe('schemaToModel', function () {
    it('type: boolean', function () {
      const model = schemaToModel({
        type: 'object',
        required: ['typeBoolean'],
        properties: {
          typeBoolean: {
            type: 'boolean'
          },
          typeBooleanTrue: {
            type: 'boolean',
            default: true
          },
          typeBooleanFalse: {
            type: 'boolean',
            default: false
          }
        }
      })
      assert.deepEqual(model, {
        typeBoolean: {
          type: DataTypes.BOOLEAN
        },
        typeBooleanTrue: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        typeBooleanFalse: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        }
      })
    })

    it('type: number', function () {
      const model = schemaToModel({
        type: 'object',
        properties: {
          typeNumber: {
            type: 'number'
          },
          typeNumberMinimum: {
            type: 'number',
            minimum: 1,
            default: 3.14
          },
          typeNumberMaximum: {
            type: 'number',
            maximum: 1
          }
        }
      })
      assert.deepEqual(model, {
        typeNumber: {
          type: DataTypes.DOUBLE
        },
        typeNumberMinimum: {
          type: DataTypes.FLOAT,
          defaultValue: 3.14
        },
        typeNumberMaximum: {
          type: DataTypes.FLOAT
        }
      })
    })

    it('type: integer', function () {
      const model = schemaToModel({
        type: 'object',
        properties: {
          typeInteger: {
            type: 'integer'
          },
          typeIntegerMultipleOf: {
            type: 'integer',
            multipleOf: 5,
            default: 40
          }
        }
      })
      assert.deepEqual(model, {
        typeInteger: {
          type: DataTypes.BIGINT
        },
        typeIntegerMultipleOf: {
          type: DataTypes.BIGINT,
          defaultValue: 40
        }
      })
    })

    it('type: string', function () {
      const model = schemaToModel({
        type: 'object',
        properties: {
          typeString: {
            type: 'string'
          },
          typeEmail: {
            type: 'string',
            format: 'email'
          },
          typeUri: {
            type: 'string',
            format: 'uri'
          },
          typePassword: {
            type: 'string',
            format: 'password'
          },
          pattern: {
            type: 'string',
            pattern: '[0-9]{1,2}x[0-9]{1,2}'
          },
          enum: {
            enum: ['one', 'two', 'three']
          },
          const: {
            const: 'one'
          },
          datetime: {
            type: 'string',
            format: 'date-time'
          },
          date: {
            type: 'string',
            format: 'date'
          },
          uuid: {
            type: 'string',
            format: 'uuid'
          }
        }
      })
      assert.deepEqual(model, {
        typeString: {
          type: DataTypes.STRING
        },
        typeEmail: {
          type: DataTypes.STRING
        },
        typeUri: {
          type: DataTypes.STRING
        },
        typePassword: {
          type: DataTypes.STRING
        },
        pattern: {
          type: DataTypes.STRING
        },
        enum: {
          type: DataTypes.STRING
        },
        const: {
          type: DataTypes.STRING
        },
        datetime: {
          type: DataTypes.DATE
        },
        date: {
          type: DataTypes.DATEONLY
        },
        uuid: {
          type: DataTypes.UUID
        }
      })
    })

    it('type: array unsupported', function () {
      assert.throws(() => {
        schemaToModel({
          type: 'object',
          properties: {
            arrayOfIntegers: {
              type: 'array',
              items: {
                type: 'integer'
              }
            }
          }
        }, /type array is not supported/)
      })
    })

    it('type: array unsupported', function () {
      assert.throws(() => {
        schemaToModel({
          type: 'object',
          properties: {
            arrayOfIntegers: {
              type: 'array',
              items: {
                type: 'integer'
              }
            }
          }
        }, /type string(\$time) is not supported/)
      })
    })
  })
})
