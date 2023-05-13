import assert from 'node:assert/strict'
import { DataTypes, Op } from 'sequelize'
import { SqlAdapter } from '../../src/adapters/SqlAdapter.js'

const { convertFilterRule, convertFindOptions, schemaToModel } = SqlAdapter

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
        schemaToModel(
          {
            type: 'object',
            properties: {
              arrayOfIntegers: {
                type: 'array',
                items: {
                  type: 'integer'
                }
              }
            }
          },
          /type array is not supported/
        )
      })
    })

    it('type: array unsupported', function () {
      assert.throws(() => {
        schemaToModel(
          {
            type: 'object',
            properties: {
              arrayOfIntegers: {
                type: 'array',
                items: {
                  type: 'integer'
                }
              }
            }
          },
          /type string(\$time) is not supported/
        )
      })
    })
  })

  describe('convertFilterRule()', function () {
    describe('string operators', function () {
      const VALUE = 'vAl%uE$'

      it('equal', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $eq: VALUE }
          }),
          {
            str: VALUE
          }
        )
      })

      it('equal case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $cs: VALUE }
          }),
          {
            str: VALUE
          }
        )
      })

      it('not equal', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $not: VALUE }
          }),
          {
            str: { [Op.not]: VALUE }
          }
        )
      })

      it('not equal case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $not: VALUE, $cs: VALUE }
          }),
          {
            str: { [Op.not]: VALUE }
          }
        )
      })

      it('like', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $like: VALUE }
          }),
          {
            str: { [Op.like]: '%vAl\\%uE$%' }
          }
        )
      })

      it('like case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $like: VALUE, $cs: VALUE }
          }),
          {
            str: { [Op.like]: '%vAl\\%uE$%' }
          }
        )
      })

      it('not like', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $not: VALUE, $like: VALUE }
          }),
          {
            str: { [Op.notLike]: '%vAl\\%uE$%' }
          }
        )
      })

      it('not like case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $like: VALUE, $not: VALUE, $cs: VALUE }
          }),
          {
            str: { [Op.notLike]: '%vAl\\%uE$%' }
          }
        )
      })

      it('starts', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $starts: VALUE }
          }),
          {
            str: { [Op.startsWith]: VALUE }
          }
        )
      })

      it('starts case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $starts: VALUE, $cs: VALUE }
          }),
          {
            str: { [Op.startsWith]: VALUE }
          }
        )
      })

      it('not starts', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $not: VALUE, $starts: VALUE }
          }),
          {
            str: { [Op.not]: { [Op.startsWith]: VALUE } }
          }
        )
      })

      it('not starts case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $starts: VALUE, $not: VALUE, $cs: VALUE }
          }),
          {
            str: { [Op.not]: { [Op.startsWith]: VALUE } }
          }
        )
      })

      it('ends', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $ends: VALUE }
          }),
          {
            str: { [Op.endsWith]: VALUE }
          }
        )
      })

      it('ends case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $ends: VALUE, $cs: VALUE }
          }),
          {
            str: { [Op.endsWith]: VALUE }
          }
        )
      })

      it('not ends', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $not: VALUE, $ends: VALUE }
          }),
          {
            str: { [Op.not]: { [Op.endsWith]: VALUE } }
          }
        )
      })

      it('not ends case sensitive', function () {
        assert.deepEqual(
          convertFilterRule({
            str: { $ends: VALUE, $not: VALUE, $cs: VALUE }
          }),
          {
            str: { [Op.not]: { [Op.endsWith]: VALUE } }
          }
        )
      })
    })

    describe('number operators', function () {
      it('equals', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { $eq: 10 }
          }),
          {
            num: 10
          }
        )
      })

      it('not equals', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { $ne: 10 }
          }),
          {
            num: { [Op.ne]: 10 }
          }
        )
      })

      it('less than', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { $lt: 10 }
          }),
          {
            num: { [Op.lt]: 10 }
          }
        )
      })

      it('less than equal', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { $lte: 10 }
          }),
          {
            num: { [Op.lte]: 10 }
          }
        )
      })

      it('greater than', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { $gt: 10 }
          }),
          {
            num: { [Op.gt]: 10 }
          }
        )
      })

      it('greater than equal', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { $gte: 10 }
          }),
          {
            num: { [Op.gte]: 10 }
          }
        )
      })

      it('range', function () {
        assert.deepEqual(
          convertFilterRule({
            num: { $gt: 5, $lte: 10 }
          }),
          {
            num: { [Op.lte]: 10, [Op.gt]: 5 }
          }
        )
      })
    })

    describe('boolean operators', function () {
      it('equals', function () {
        assert.deepEqual(
          convertFilterRule({
            bool: { $eq: true }
          }),
          {
            bool: true
          }
        )
      })

      it('not equals', function () {
        assert.deepEqual(
          convertFilterRule({
            bool: { $ne: true }
          }),
          {
            bool: { [Op.ne]: true }
          }
        )
      })
    })

    describe('array', function () {
      it('query for multiple fields', function () {
        assert.deepEqual(
          convertFilterRule({
            id: { $eq: ['10', '12', '14'] }
          }),
          {
            [Op.and]: [{ [Op.or]: [{ id: '10' }, { id: '12' }, { id: '14' }] }]
          }
        )
      })
    })

    describe('complex search', function () {
      it('query for multiple fields', function () {
        assert.deepEqual(
          convertFilterRule({
            item: { $not: true, $cs: true, $like: 'Journal' }
          }),
          {
            item: { [Op.notLike]: '%Journal%' }
          }
        )
      })

      it('query for multiple fields', function () {
        assert.deepEqual(
          convertFilterRule({
            $or: [
              { item: { $eq: 'Journal' } },
              { item: { $like: 'oo' } }
            ]
          }),
          {
            [Op.or]: [
              {
                item: 'Journal'
              },
              {
                item: { [Op.like]: '%oo%' }
              }
            ]
          }
        )
      })
    })
  })

  describe('convertFindOptions()', function () {
    it('shall convert', function () {
      assert.deepEqual(
        convertFindOptions({
          offset: 10,
          limit: 500,
          fields: ['aa', 'foo', 'bar'],
          sort: [{ aa: 1 }, { bar: 0 }]
        }),
        {
          attributes: ['aa', 'foo', 'bar'],
          limit: 500,
          offset: 10,
          order: [
            ['aa', 'ASC'],
            ['bar', 'DESC']
          ]
        }
      )
    })

    it('shall ignore', function () {
      assert.deepEqual(
        convertFindOptions({
          offset: '10a',
          limit: 500,
          fields: 'aa',
          sort: 'buuh'
        }),
        {
          offset: 0,
          limit: 500,
          order: [['createdAt', 'ASC']]
        }
      )
    })
  })
})
