from flask import Flask, render_template, request, send_file, jsonify
import csv
import io
import random
import string
import json

app = Flask(__name__)

# Store form data and responses in memory for demo purposes
forms = {}
responses = {}

@app.route('/')
def index():
    """Renders the basic form generator page."""
    return render_template('index.html')

@app.route('/advanced')
def advanced():
    """Renders the advanced form generator page."""
    return render_template('advanced.html')

@app.route('/pro')
def pro():
    """Renders the pro form generator page."""
    return render_template('pro.html')

@app.route('/create_form', methods=['POST'])
def create_form():
    """
    Saves the form data, including advanced options, and returns a unique form ID.
    The form data is stored in a simple dictionary in memory.
    """
    form_data = request.json
    # Generate a unique 8-character ID for the form
    form_id = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    forms[form_id] = form_data
    return jsonify({'form_id': form_id})

@app.route('/generate_responses', methods=['POST'])
def generate_responses():
    """
    Generates a specified number of responses based on the form's configuration.
    This function now handles advanced rules for number fields, probabilistic
    selections for categorical fields, and new conditional logic for 'computed' fields.
    """
    data = request.json
    form_id = data['form_id']
    num_responses = int(data['num_responses'])

    if form_id not in forms:
        return jsonify({'error': 'Form not found'}), 404

    form = forms[form_id]
    generated = []

    for _ in range(num_responses):
        response = {}
        # First, generate values for all non-computed fields
        for field in form['fields']:
            field_label = field['label']
            field_type = field['type']
            
            if field_type == 'text':
                response[field_label] = ''.join(random.choices(string.ascii_letters, k=10))
            
            elif field_type == 'number':
                range_type = field.get('range_type')
                if range_type == 'between':
                    min_val = int(field['range_min'])
                    max_val = int(field['range_max'])
                    response[field_label] = random.randint(min_val, max_val)
                elif range_type == 'less_than':
                    max_val = int(field['range_max'])
                    response[field_label] = random.randint(1, max_val - 1)
                elif range_type == 'greater_than':
                    min_val = int(field['range_min'])
                    response[field_label] = random.randint(min_val + 1, 1000)
                else:
                    response[field_label] = random.randint(1, 100)
            
            elif field_type in ['radio', 'dropdown', 'checkbox']:
                options = field['options']
                probabilities = [opt.get('probability', 0) for opt in options]
                
                if len(options) == 1 and sum(probabilities) == 0:
                    probabilities[0] = 100

                choices = [opt['text'] for opt in options]
                
                if field_type == 'checkbox':
                    num_to_select = random.randint(1, len(options))
                    selected = random.sample(choices, num_to_select)
                    response[field_label] = ', '.join(selected)
                else:
                    selected = random.choices(choices, weights=probabilities, k=1)[0]
                    response[field_label] = selected
        
        # Now, process the 'computed' fields based on the generated values
        for field in form['fields']:
            if field['type'] == 'computed':
                dependency = field['dependency']
                dependent_field_label = dependency['field']
                rules = dependency['rules']
                
                dependent_value = response.get(dependent_field_label)
                
                if dependent_value is not None:
                    computed_value = None
                    for rule in rules:
                        condition = rule['condition']
                        value = rule['value']
                        result = rule['result']
                        
                        # Apply the condition, checking for both numeric and string values
                        condition_met = False
                        try:
                            # Try to treat values as numbers
                            dep_val = int(dependent_value)
                            rule_val = int(value)
                            if condition == 'less_than' and dep_val < rule_val:
                                condition_met = True
                            elif condition == 'greater_than' and dep_val > rule_val:
                                condition_met = True
                            elif condition == 'equals' and dep_val == rule_val:
                                condition_met = True
                            elif condition == 'between' and '-' in value:
                                min_val, max_val = map(int, value.split('-'))
                                if min_val <= dep_val <= max_val:
                                    condition_met = True
                        except ValueError:
                            # If they are not numbers, treat as strings
                            if condition == 'equals' and str(dependent_value).lower() == str(value).lower():
                                condition_met = True
                        
                        if condition_met:
                            computed_value = result
                            break # Use the first rule that matches
                    
                    response[field['label']] = computed_value if computed_value is not None else "N/A"

        generated.append(response)

    if form_id not in responses:
        responses[form_id] = []
    
    responses[form_id].extend(generated)
    
    return jsonify({'responses': generated})

@app.route('/export_csv/<form_id>')
def export_csv(form_id):
    """Exports generated responses for a given form ID to a CSV file."""
    if form_id not in responses:
        return "No responses found for this form", 404
    
    si = io.StringIO()
    cw = csv.writer(si)
    
    # Write header
    if responses[form_id]:
        headers = responses[form_id][0].keys()
        cw.writerow(headers)
        
        # Write data
        for response in responses[form_id]:
            cw.writerow(response.values())
    
    output = si.getvalue()
    si.close()
    
    return send_file(
        io.BytesIO(output.encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'responses_{form_id}.csv'
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)