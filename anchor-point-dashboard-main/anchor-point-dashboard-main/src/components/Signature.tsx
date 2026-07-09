import SignatureCanvas from 'react-signature-canvas';

function Signature(props: any) {

    return(
        <SignatureCanvas 
            penColor='blue'
            onEnd={props.SignatureToImage}
            canvasProps={{height:200}}
            backgroundColor='#ffffff'
            />
    )
}

export default Signature
