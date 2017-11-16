from matplotlib import cm
from numpy import linspace

cmap = []

for i in range(256):
    r, g, b, a = cm.inferno(i)
    cmap.append([round(float(r), 6), round(float(g), 6), round(float(b), 6)])

cmap.reverse()

number_of_colors = 20
boundaries = linspace(0, 255, number_of_colors + 1)
color_ids = []

for i in range(0, len(boundaries) - 1):
    color_id = (boundaries[i] + boundaries[i + 1]) / 2
    color_ids.append(int(round(color_id)))

color_scale = []

for color_id in color_ids:
    for i in range(256 // number_of_colors):
        color_scale.append(cmap[color_id])

for i in range(256 % number_of_colors):
    color_scale.append(cmap[color_ids[-1]])

print(len(set([tuple(i) for i in color_scale])), len(color_scale))

with open('conservationColorScale.js', encoding = 'UTF-8', mode = 'w') as file:
    file.write('var conservationColorScale = ' + str(color_scale) + ';')
