from pydantic import BaseModel

class ThemeUpdate(BaseModel):
    accent_color: str | None = None
    font_choice: str | None = None
    wallpaper_id: str | None = None
