import React from 'react';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

const messageTemplates: MessageTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    content: 'Hey [username]! Thanks for your interest in [keyword]. I\'ll send you the link right away! ✨',
    variables: ['username', 'keyword']
  },
  {
    id: 'link_share',
    name: 'Link Sharing',
    content: 'Hi [username]! Here\'s the link you requested for [keyword]. Hope this helps! 🔗',
    variables: ['username', 'keyword']
  },
  {
    id: 'follow_up',
    name: 'Follow Up',
    content: 'Hey [username]! Did you get a chance to check out the [keyword] link I sent? Let me know if you have any questions! 💬',
    variables: ['username', 'keyword']
  },
  {
    id: 'custom',
    name: 'Custom Message',
    content: 'Create your own custom message with [username] and [keyword] placeholders.',
    variables: ['username', 'keyword']
  }
];

interface MessageTemplatesProps {
  onSelectTemplate: (template: MessageTemplate) => void;
  selectedTemplate?: string;
}

const MessageTemplates: React.FC<MessageTemplatesProps> = ({ 
  onSelectTemplate, 
  selectedTemplate 
}) => {
  return (
    <div className="message-templates">
      <h3 className="templates-title">Message Templates</h3>
      <p className="templates-description">
        Choose a template and customize it with [username] and [keyword] placeholders
      </p>
      
      <div className="templates-grid">
        {messageTemplates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => onSelectTemplate(template)}
          >
            <h4 className="template-name">{template.name}</h4>
            <p className="template-preview">{template.content}</p>
            <div className="template-variables">
              {template.variables.map((variable) => (
                <span key={variable} className="variable-tag">
                  [{variable}]
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageTemplates;