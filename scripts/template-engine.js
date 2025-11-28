/**
 * Professional Template Engine
 * 
 * A template engine inspired by ref_app2's Jinja2 approach, adapted for our JavaScript environment.
 * This engine processes HTML templates with data injection and conditional logic.
 */

/**
 * Process a template string with provided data
 * 
 * @param {string} template - HTML template with placeholders
 * @param {Object} data - Data to inject into template
 * @returns {string} Processed HTML
 */
export function processTemplate(template, data) {
  // Handle for loops: {% for item in items %}...{% endfor %}
  template = processForLoops(template, data);
  
  // Handle conditionals: {% if condition %}...{% endif %}
  template = processConditionals(template, data);
  
  // Handle simple variable replacements: {{ variable }}
  template = processVariables(template, data);
  
  return template;
}

/**
 * Process for loops in template
 */
function processForLoops(template, data) {
  const forRegex = /{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%}([\s\S]*?){%\s*endfor\s*%}/g;
  
  return template.replace(forRegex, (match, itemName, arrayName, content) => {
    const array = getNestedProperty(data, arrayName);
    if (!Array.isArray(array)) return '';
    
    return array.map(item => {
      const itemData = { ...data, [itemName]: item };
      return processTemplate(content, itemData);
    }).join('');
  });
}

/**
 * Process conditionals in template
 */
function processConditionals(template, data) {
  const ifRegex = /{%\s*if\s+(.*?)\s*%}([\s\S]*?){%\s*endif\s*%}/g;
  
  return template.replace(ifRegex, (match, condition, content) => {
    if (evaluateCondition(condition, data)) {
      return processTemplate(content, data);
    }
    return '';
  });
}

/**
 * Process simple variable replacements
 */
function processVariables(template, data) {
  // Handle simple variable replacements: {{ variable }}
  return template.replace(/{{\s*([^}]+?)\s*}}/g, (match, variable) => {
    // Handle filters like |default("")
    const [varName, filter] = variable.split('|').map(s => s.trim());
    let value = getNestedProperty(data, varName);
    
    // Apply filters
    if (filter) {
      if (filter.startsWith('default(')) {
        const defaultValue = filter.match(/default\("([^"]*)"\)/)?.[1] || '';
        value = (value === undefined || value === null || value === '') ? defaultValue : value;
      } else if (filter === 'trim') {
        value = typeof value === 'string' ? value.trim() : value;
      }
    }
    
    return value !== undefined && value !== null ? String(value) : '';
  });
}

/**
 * Evaluate condition in template
 */
function evaluateCondition(condition, data) {
  // Simple condition evaluation
  condition = condition.trim();
  
  // Handle "variable|length > 0" type conditions
  if (condition.includes('|length')) {
    const varName = condition.split('|')[0].trim();
    const array = getNestedProperty(data, varName);
    return Array.isArray(array) && array.length > 0;
  }
  
  // Handle simple truthiness check
  const value = getNestedProperty(data, condition);
  return value !== undefined && value !== null && value !== '';
}

/**
 * Get nested property from object
 */
function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Generate HTML from template file
 * 
 * @param {string} templatePath - Path to template file
 * @param {Object} data - Data to inject into template
 * @returns {string} Processed HTML
 */
export function generateFromTemplateFile(templatePath, data) {
  const fs = require('fs');
  const path = require('path');
  
  // Read template file
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // Process template with data
  return processTemplate(template, data);
}

/**
 * Save processed template to file
 * 
 * @param {string} templatePath - Path to template file
 * @param {Object} data - Data to inject into template
 * @param {string} outputPath - Path where output should be saved
 */
export function saveTemplateToFile(templatePath, data, outputPath) {
  const fs = require('fs');
  
  const html = generateFromTemplateFile(templatePath, data);
  fs.writeFileSync(outputPath, html);
  console.log(`Template processed and saved to ${outputPath}`);
}

// Example usage:
/*
import { processTemplate } from './template-engine.js';

const template = `
<h1>{{ title }}</h1>
<ul>
{% for item in items %}
  <li>{{ item.name }} - {{ item.value }}</li>
{% endfor %}
</ul>
`;

const data = {
  title: 'My List',
  items: [
    { name: 'Item 1', value: 100 },
    { name: 'Item 2', value: 200 }
  ]
};

const result = processTemplate(template, data);
console.log(result);
*/