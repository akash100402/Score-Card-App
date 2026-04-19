def format_number(value):
    """Format number to remove .0 if it's a whole number"""
    if value is None:
        return None
    if isinstance(value, float):
        # If it's a whole number (e.g., 44.0), return as integer without decimal
        if value.is_integer():
            return int(value)
        # Otherwise keep 2 decimal places
        return round(value, 2)
    return value

def scorecard_helper(score) -> dict:
    # Calculate total and accuracy as floats
    total = float(score.get("reasoning", 0) + score.get("english", 0) + 
                  score.get("gs", 0) + score.get("aptitude", 0))
    
    # Calculate accuracy: (correct / attempt) * 100
    attempt = float(score.get("attempt", 0))
    correct = float(score.get("correct", 0))
    accuracy = (correct / attempt * 100) if attempt > 0 else 0.0
    
    # Convert datetime to date string for JSON response
    date_value = score["date"]
    if hasattr(date_value, 'date'):
        date_str = date_value.date().isoformat()
    else:
        date_str = str(date_value)
    
    return {
        "id": str(score["_id"]),
        "user_id": score["user_id"],
        "sno": score.get("sno", 0),
        "source": score["source"],
        "date": date_str,
        "reasoning": format_number(score["reasoning"]),
        "english": format_number(score["english"]),
        "gs": format_number(score["gs"]),
        "aptitude": format_number(score["aptitude"]),
        "total": format_number(total),
        "attempt": format_number(score["attempt"]),
        "correct": format_number(score["correct"]),
        "wrong": format_number(score["wrong"]),
        "accuracy": format_number(round(accuracy, 2)),
        "percentile": format_number(score["percentile"])
    }