Images for posts go here.

Reference them by filename alone - the build copies this folder to `/img/` and
rewrites the paths:

```markdown
![alt text](desk.jpg "the caption under the picture")
![alt text](desk.jpg "a landscape one #wide")
```

`#wide` at the end of the caption lets the image break out past the text column.

Sub-folders work too; `![x](trips/kuwait.jpg)` becomes `/img/trips/kuwait.jpg`.
