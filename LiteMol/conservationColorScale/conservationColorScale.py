from matplotlib import cm

cmap = []

for i in range(256):
    r, g, b, a = cm.inferno(i)
    cmap.append([round(float(r), 6), round(float(g), 6), round(float(b), 6)])

with open('conservationColorScale.js', encoding = 'UTF-8', mode = 'w') as file:
    file.write('var conservationColorScale = ' + str(cmap) + ';')
