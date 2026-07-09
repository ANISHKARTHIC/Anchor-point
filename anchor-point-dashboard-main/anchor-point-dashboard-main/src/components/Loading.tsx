import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

function Loading(props: any) {
    return(
        <div className='flex items-center justify-center mt-10'>
            <Box sx={{flexDirection: 'column'}}>
            { [...Array(props.times)].map((items: any) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ margin: 1 }}>
                        <Skeleton variant="rounded" width={50} height={50} />
                    </Box>
                    <Box sx={{ width: '100%' }}>
                        <Skeleton variant="text" width={510} sx={{ fontSize: '1rem' }} />
                        <Skeleton variant="text" width={410} sx={{ fontSize: '1rem' }} />
                    </Box>
                </Box>
            ))}
            </Box>
        </div>
    )
}

export default Loading;
