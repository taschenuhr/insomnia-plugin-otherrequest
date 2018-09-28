module.exports.templateTags = [
  {
    name: 'otherrequest',
    displayName: 'Request',
    description: "reference values from other request's attributes",
    args: [
      {
        displayName: 'Formfield',
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

      if (!['formfield', 'query'].includes(field)) {
        throw new Error(`Invalid response field ${field}`);
      }

      if (!id) {
        throw new Error('No request specified');
      }

      const request = await context.util.models.request.getById(id);
      if (!request) {
        throw new Error(`Could not find request ${id}`);
      }

      const response = await context.util.models.response.getLatestForRequestId(id);

      if (!response) {
        throw new Error('No responses for request');
      }

      if (!response.statusCode) {
        throw new Error('No successful responses for request');
      }

      const sanitizedFilter = filter.trim();

      let attributes = [];
      if (field === 'formfield') {
        if (!request.body.params) {
          throw new Error('No formfields for request');
        }
        attributes = request.body.params;
      } else if (field === 'query') {
        if (!request.parameters) {
          throw new Error('No query for request');
        }
        attributes = request.parameters;
      } else {
        throw new Error(`Unknown field ${field}`);
      }

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
  }
];
