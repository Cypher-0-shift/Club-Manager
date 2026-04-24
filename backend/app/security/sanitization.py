"""
Input Sanitization - Prevent XSS and injection attacks
"""
import bleach
from typing import Optional
import re


# Allowed HTML tags for rich text (very restrictive)
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
    'a', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3'
]

# Allowed HTML attributes
ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title'],
    'code': ['class'],
}

# Allowed URL protocols
ALLOWED_PROTOCOLS = ['http', 'https', 'mailto']


def sanitize_html(html: Optional[str], strip: bool = False) -> Optional[str]:
    """
    Sanitize HTML input to prevent XSS attacks.
    
    PHASE 3: Uses bleach library to strip dangerous HTML/JavaScript.
    
    Args:
        html: HTML string to sanitize
        strip: If True, strip all HTML tags. If False, allow safe tags.
        
    Returns:
        Sanitized HTML string
        
    Example:
        # Allow safe HTML
        sanitize_html("<p>Hello <script>alert('xss')</script></p>")
        # Returns: "<p>Hello </p>"
        
        # Strip all HTML
        sanitize_html("<p>Hello <b>world</b></p>", strip=True)
        # Returns: "Hello world"
    """
    if not html:
        return html
    
    if strip:
        # Strip all HTML tags
        return bleach.clean(html, tags=[], strip=True)
    else:
        # Allow only safe HTML tags
        return bleach.clean(
            html,
            tags=ALLOWED_TAGS,
            attributes=ALLOWED_ATTRIBUTES,
            protocols=ALLOWED_PROTOCOLS,
            strip=True
        )


def sanitize_text(text: Optional[str], max_length: Optional[int] = None) -> Optional[str]:
    """
    Sanitize plain text input.
    
    PHASE 3: Removes control characters and normalizes whitespace.
    
    Args:
        text: Text to sanitize
        max_length: Maximum allowed length (truncate if longer)
        
    Returns:
        Sanitized text
        
    Example:
        sanitize_text("Hello\\x00World\\r\\n", max_length=10)
        # Returns: "HelloWorld"
    """
    if not text:
        return text
    
    # Remove null bytes and other control characters (except newlines and tabs)
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    
    # Normalize whitespace (replace multiple spaces with single space)
    text = re.sub(r'\s+', ' ', text)
    
    # Trim whitespace
    text = text.strip()
    
    # Truncate if needed
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text


def sanitize_filename(filename: Optional[str]) -> Optional[str]:
    """
    Sanitize filename to prevent directory traversal attacks.
    
    Args:
        filename: Filename to sanitize
        
    Returns:
        Safe filename
        
    Example:
        sanitize_filename("../../etc/passwd")
        # Returns: "passwd"
        
        sanitize_filename("my file (1).pdf")
        # Returns: "my_file_1.pdf"
    """
    if not filename:
        return filename
    
    # Remove directory separators
    filename = filename.replace('/', '_').replace('\\', '_')
    
    # Remove null bytes
    filename = filename.replace('\x00', '')
    
    # Remove leading dots (hidden files)
    filename = filename.lstrip('.')
    
    # Replace spaces and special characters with underscores
    filename = re.sub(r'[^\w\s.-]', '_', filename)
    filename = re.sub(r'\s+', '_', filename)
    
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')
    
    return filename


def sanitize_url(url: Optional[str]) -> Optional[str]:
    """
    Sanitize URL to prevent javascript: and data: protocol attacks.
    
    Args:
        url: URL to sanitize
        
    Returns:
        Safe URL or None if invalid
        
    Example:
        sanitize_url("javascript:alert('xss')")
        # Returns: None
        
        sanitize_url("https://example.com")
        # Returns: "https://example.com"
    """
    if not url:
        return url
    
    url = url.strip()
    
    # Check for dangerous protocols
    dangerous_protocols = ['javascript:', 'data:', 'vbscript:', 'file:']
    url_lower = url.lower()
    
    for protocol in dangerous_protocols:
        if url_lower.startswith(protocol):
            return None
    
    # Only allow http, https, and mailto
    if not (url_lower.startswith('http://') or 
            url_lower.startswith('https://') or 
            url_lower.startswith('mailto:')):
        return None
    
    return url


def sanitize_sql_like_pattern(pattern: Optional[str]) -> Optional[str]:
    """
    Sanitize SQL LIKE pattern to prevent injection.
    
    Args:
        pattern: LIKE pattern to sanitize
        
    Returns:
        Escaped pattern
        
    Example:
        sanitize_sql_like_pattern("test%'; DROP TABLE users; --")
        # Returns: "test\\%'; DROP TABLE users; --"
    """
    if not pattern:
        return pattern
    
    # Escape special LIKE characters
    pattern = pattern.replace('\\', '\\\\')
    pattern = pattern.replace('%', '\\%')
    pattern = pattern.replace('_', '\\_')
    
    return pattern
