import neopixel
import board
from webcolors import name_to_rgb
import sys 

if __name__ == '__main__':
    pixels = neopixel.NeoPixel(board.D21, 1, brightness=1)
    r, g, b, = name_to_rgb(sys.argv[1])
    pixels[0] = (g, r, b)
