const { JSONPath } = require('jsonpath-plus');

module.exports.templateTags = [
  {
    name: 'otherrequest',
    displayName: 'Request',
    description: "reference values from other request's attributes",
    args: [
      {
        displayName: 'Type',
        type: 'enum',
        options: [
          {
            displayName: 'Formfield',
            description: 'value of request formfield',
            value: 'formfield'
          },
          {
            displayName: 'QueryParam',
            description: 'value of request query param',
            value: 'query'
          },
          {
            displayName: 'Post body',
            description: 'value of request body',
            value: 'body'
          }
        ]
      },
      {
        displayName: 'Request',
        type: 'model',
        model: 'Request'
      },
      {
        type: 'string',
        displayName: 'Attribute name'
      }
    ],

    async run(context, field, id, filter) {
      filter = filter || '';

      if (!['formfield', 'query', 'body'].includes(field)) {
        throw new Error(`Invalid response field '${field}'`);
      }

      if (!id) {
        throw new Error('No request specified');
      }

      const request = await context.util.models.request.getById(id);
      if (!request) {
        throw new Error(`Could not find request '${id}'`);
      }

      const response = await context.util.models.response.getLatestForRequestId(id);

      if (!response) {
        throw new Error('No responses for request');
      }

      if (!response.statusCode) {
        throw new Error('No successful responses for request');
      }

      if (field === 'formfield') {
        if (!request.body.params) {
          throw new Error('No formfields for request');
        }
        return searchByParams(request.body.params. filter);
      } else if (field === 'body') {
        if (!request.body.text) {
          throw new Error('No body for request');
        }
        return searchByXpath(request.body.text, filter);
      } else if (field === 'query') {
        if (!request.parameters) {
          throw new Error('No query for request');
        }
        return searchByParams(request.parameters, filter);
      } else {
        throw new Error(`Unknown field ${field}`);
      }
    }
  }
];

/**
 * 
 * @param {*} attributes 
 * @param {*} filter 
 * @returns 
 */
function searchByParams(attributes, filter)
{
    const sanitizedFilter = filter.trim();

    const choices = attributes.filter(attr => !attr.disabled)
      .map(attr => attr.name)
      .filter((value, index, self) => self.indexOf(value) === index)
      .join(',\n\t');

    if (!filter) {
      throw new Error("No attribute name given. Choices:\n\t" + choices);
    }

    for (const attr of attributes) {
        if (!attr.disabled && attr.name === sanitizedFilter) {
          return context.util.render(attr.value);
        }
    }

    throw new Error(`Attribute name '${sanitizedFilter}' not found. Choices:\n\t${choices}`);
}

/**
 * 
 * @param {*} body 
 * @param {*} filter 
 * @returns 
 */
function searchByXpath(body, filter)
{
    if (!filter) {
      filter = '$';
    }

    const sanitizedFilter = filter.trim();

    if (sanitizedFilter.indexOf('$') === 0) {
      return matchJSONPath(body, sanitizedFilter);
    } else {
      return matchXPath(body, sanitizedFilter);
    }
}

function matchJSONPath(bodyStr, query) {
  let body;
  let results;

  try {
    body = JSON.parse(bodyStr);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }

  try {
    results = JSONPath({json: body, path: query});
  } catch (err) {
    throw new Error(`Invalid JSONPath query: ${query}`);
  }

  if (results.length === 0) {
    throw new Error(`Returned no results: ${query}`);
  }

  if (results.length > 1 ) {
    return JSON.stringify(results);
  }

  if (typeof results[0] !== 'string') {
    return JSON.stringify(results[0]);
  } else {
    return results[0];
  }
}

function matchXPath(bodyStr, query) {
  const results = queryXPath(bodyStr, query);

  if (results.length === 0) {
    throw new Error(`Returned no results: ${query}`);
  } else if (results.length > 1) {
    throw new Error(`Returned more than one result: ${query}`);
  }

  return results[0].inner;
}

/**
 * Query an XML blob with XPath
 */
const queryXPath = (xml, query) => {
  const DOMParser = require('xmldom').DOMParser
  const dom = new DOMParser().parseFromString(xml);
  let selectedValues = [];
  if (query === undefined) {
    throw new Error('Must pass an XPath query.');
  }
  try {
    selectedValues = require('xpath').select(query, dom);
  } catch (err) {
    throw new Error(`Invalid XPath query: ${query}`);
  }
  const output = [];
  // Functions return plain strings
  if (typeof selectedValues === 'string') {
    output.push({
      outer: selectedValues,
      inner: selectedValues,
    });
  } else {
    for (const selectedValue of selectedValues || []) {
      switch (selectedValue.constructor.name) {
        case 'Attr':
          output.push({
            outer: selectedValue.toString().trim(),
            inner: selectedValue.nodeValue,
          });
          break;

        case 'Element':
          output.push({
            outer: selectedValue.toString().trim(),
            inner: selectedValue.childNodes.toString(),
          });
          break;

        case 'Text':
          output.push({
            outer: selectedValue.toString().trim(),
            inner: selectedValue.toString().trim(),
          });
          break;

        default:
          break;
      }
    }
  }
  return output;
};

