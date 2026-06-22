import { Box, Typography } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'

interface Props {
  section: 1 | 2 | 3 | 4 | 5
}

const NODES = [
  { x: 0,   image: '/images/triumph.png', label: 'Départ'   },
  { x: 33,  dot: true,                    label: 'Profil'   },
  { x: 67,  dot: true,                    label: 'Besoins'  },
  { x: 100, image: '/images/eiffel.png',  label: 'Arrivée' },
]

const METRO_X  = [10, 25, 50, 75, 88]
const TRACK_TOP = 44
const IMG_D     = 52
const DOT_D     = 22
const METRO_H   = 34
const LABEL_H   = 18

export function LandmarkStepper({ section }: Props) {
  const s      = Math.max(1, Math.min(section, 5))
  const metroX = METRO_X[s - 1]
  const containerH = TRACK_TOP + IMG_D / 2 + LABEL_H + 10

  return (
    <Box sx={{
      width: '100%', maxWidth: 720, mx: 'auto',
      userSelect: 'none',
      px: `${IMG_D / 2}px`,
    }}>
      <Box sx={{ position: 'relative', height: containerH }}>

        <Box sx={{
          position: 'absolute', left: 0, right: 0, top: TRACK_TOP,
          height: 4, borderRadius: 99,
          bgcolor: 'rgba(26,86,219,0.1)',
        }} />

        <Box sx={{
          position: 'absolute', left: 0, top: TRACK_TOP, height: 4,
          width: s === 5 ? '100%' : `${metroX}%`,
          background: 'linear-gradient(90deg, #3b82f6 0%, #1a56db 100%)',
          borderRadius: 99,
          boxShadow: '0 0 8px rgba(26,86,219,0.35)',
          transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
        }} />

        <Box
          component="img"
          src="/images/metro.png"
          alt="métro"
          sx={{
            position: 'absolute',
            left: `${metroX}%`,
            top: TRACK_TOP - METRO_H - 3,
            transform: 'translateX(-50%)',
            height: { xs: 26, md: METRO_H },
            width: 'auto',
            objectFit: 'contain',
            transition: 'left 0.7s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 4,
            filter: 'drop-shadow(0 2px 4px rgba(26,86,219,0.3))',
          }}
        />

        {NODES.map((node, i) => {
          const isStart = node.x === 0
          const isEnd   = node.x === 100
          const reached = isEnd ? s === 5 : metroX >= node.x
          const checked = reached && (isEnd || metroX > node.x)
          const active  = (isEnd && reached) || (isStart && s === 1)

          return (
            <Box
              key={i}
              sx={{
                position: 'absolute', left: `${node.x}%`, top: 0,
                transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                zIndex: 2,
              }}
            >
              {node.image ? (
                <>
                  <Box sx={{
                    width: { xs: 42, md: IMG_D },
                    height: { xs: 42, md: IMG_D },
                    mt: `${TRACK_TOP - IMG_D / 2}px`,
                    borderRadius: '50%',
                    border: '2.5px solid',
                    borderColor: (reached || isStart) ? '#1a56db' : 'rgba(0,0,0,0.12)',
                    bgcolor: checked ? '#eff6ff' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                    transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: active
                      ? '0 0 0 5px rgba(26,86,219,0.15), 0 4px 16px rgba(26,86,219,0.2)'
                      : checked
                        ? '0 2px 8px rgba(26,86,219,0.15)'
                        : '0 2px 6px rgba(0,0,0,0.07)',
                  }}>
                    <Box
                      component="img"
                      src={node.image}
                      alt={node.label}
                      sx={{
                        width: '64%', height: '64%', objectFit: 'contain',
                        filter: !reached && !isStart ? 'grayscale(1) opacity(0.25)' : 'none',
                        transition: 'filter 0.4s',
                      }}
                    />
                    {checked && (
                      <Box sx={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1a56db 0%, #2563eb 100%)',
                        opacity: 0.87,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CheckIcon sx={{ color: '#fff', fontSize: { xs: 16, md: 19 } }} />
                      </Box>
                    )}
                  </Box>
                  <Typography sx={{
                    fontSize: { xs: 9.5, md: 11.5 },
                    fontWeight: (reached || isStart) ? 700 : 500,
                    color: (reached || isStart) ? '#1a56db' : 'text.disabled',
                    whiteSpace: 'nowrap', mt: 0.6,
                    letterSpacing: 0.2,
                    transition: 'color 0.3s',
                  }}>
                    {node.label}
                  </Typography>
                </>
              ) : (
                <>
                  <Box sx={{
                    width: { xs: 18, md: DOT_D },
                    height: { xs: 18, md: DOT_D },
                    mt: `${TRACK_TOP - DOT_D / 2}px`,
                    borderRadius: '50%',
                    background: reached
                      ? 'linear-gradient(135deg, #3b82f6, #1a56db)'
                      : 'rgba(0,0,0,0.12)',
                    transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)',
                    transform: reached ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: reached ? '0 0 0 4px rgba(26,86,219,0.15), 0 2px 8px rgba(26,86,219,0.25)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {reached && <CheckIcon sx={{ color: '#fff', fontSize: { xs: 10, md: 12 } }} />}
                  </Box>
                  <Typography sx={{
                    fontSize: { xs: 9.5, md: 11.5 },
                    fontWeight: reached ? 700 : 500,
                    color: reached ? '#1a56db' : 'text.disabled',
                    whiteSpace: 'nowrap', mt: 0.75,
                    letterSpacing: 0.2,
                    transition: 'color 0.3s',
                  }}>
                    {node.label}
                  </Typography>
                </>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
