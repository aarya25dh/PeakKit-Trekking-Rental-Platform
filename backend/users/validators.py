from django.core.exceptions import ValidationError
import re


class CustomPasswordValidator:
    """
    Custom password validator that enforces:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """

    def __init__(self):
        self.min_length = 8
        self.special_characters = r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]'

    def validate(self, password, user=None):
        errors = []

        # Check minimum length
        if len(password) < self.min_length:
            errors.append(
                f"Password must be at least {self.min_length} characters long."
            )

        # Check for uppercase letter
        if not re.search(r'[A-Z]', password):
            errors.append(
                "Password must contain at least one uppercase letter."
            )

        # Check for lowercase letter
        if not re.search(r'[a-z]', password):
            errors.append(
                "Password must contain at least one lowercase letter."
            )

        # Check for digit
        if not re.search(r'\d', password):
            errors.append(
                "Password must contain at least one digit."
            )

        # Check for special character
        if not re.search(self.special_characters, password):
            errors.append(
                "Password must contain at least one special character (!@#$%^&*()_+-=[]{}:;'\"<>?/\\|`~)."
            )

        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        return (
            f"Your password must contain at least {self.min_length} characters, "
            "including at least one uppercase letter, one lowercase letter, "
            "one digit, and one special character."
        )


class PasswordStrengthChecker:
    """
    Evaluate password strength and provide suggestions.
    Returns score (0-4) and strength level (Weak, Fair, Strong, Very Strong)
    """

    def __init__(self):
        self.special_characters = r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]'

    def check_strength(self, password):
        score = 0
        suggestions = []

        # Check length
        if len(password) >= 8:
            score += 1
        else:
            suggestions.append("Use at least 8 characters.")

        if len(password) >= 12:
            score += 1
        else:
            suggestions.append("Use at least 12 characters for better security.")

        # Check for uppercase
        if re.search(r'[A-Z]', password):
            score += 1
        else:
            suggestions.append("Add at least one uppercase letter.")

        # Check for lowercase
        if re.search(r'[a-z]', password):
            score += 1
        else:
            suggestions.append("Add at least one lowercase letter.")

        # Check for digit
        if re.search(r'\d', password):
            score += 1
        else:
            suggestions.append("Add at least one number.")

        # Check for special character
        if re.search(self.special_characters, password):
            score += 1
        else:
            suggestions.append("Add at least one special character.")

        # Determine strength level
        if score <= 2:
            strength = "Weak"
        elif score <= 4:
            strength = "Fair"
        elif score <= 5:
            strength = "Strong"
        else:
            strength = "Very Strong"

        # Normalize score to 0-4
        normalized_score = min(score, 4)

        return {
            "score": normalized_score,
            "strength": strength,
            "suggestions": suggestions
        }
