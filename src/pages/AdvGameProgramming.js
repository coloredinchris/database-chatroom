import { Link } from 'react-router-dom';
//import { track } from "@vercel/analytics/react";
import "../styles/ReportStyles.css";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

const AdvGameProgrammingReport = () => {
    return (
        <div className="report-container">
            <header>
                <h1>Advanced Game Programming</h1>
                <h2>The Curse of Erephos (TBD)</h2>
                <p><strong>By: Michael Hamilton</strong> | <em>Spring 2025</em></p>
            </header>

            {/* Project Description */}
            <section>

            <h2>Project Overview</h2>

            <p>
                <strong>The Curse of Erephos</strong> is a stealth-action game inspired by <em>Dishonored</em> and <em>Aragami</em>.  
                Like <em>Dishonored</em>, the game presents players with moral choices—whether to take a lethal approach  
                or rely on stealth to outmaneuver enemies. However, this story unfolds in a mystical island setting  
                where <strong>light and shadow</strong> are deeply entwined in history and power.
            </p>

            <p>
                Players assume the role of a prisoner captured by the <strong>Solmara</strong>, a ruling faction that harnesses the power of light.  
                The Solmara have occupied <strong>Erephos</strong> for centuries, oppressing the remnants of the <strong>Umbric</strong>,  
                an ancient civilization that once wielded shadows to sustain their land.  
                The protagonist, imprisoned by the Solmara, becomes the unwilling host of a vengeful shadow spirit—  
                a remnant of the Umbric people’s lost power.
            </p>

            <p>
                This shadow-infused curse grants supernatural abilities tied to darkness but threatens to consume the player’s humanity.  
                As they escape captivity and explore the island, they must decide whether to <strong>embrace vengeance</strong>,  
                using the shadows as a weapon against their oppressors, or to <strong>restore balance</strong>,  
                breaking the cycle of destruction that has plagued Erephos for centuries.
            </p>

            <h3>Why This Project?</h3>

            <p>
                This project is an exploration of stealth mechanics and immersive world-building.  
                The focus is on creating a game where choices carry weight,  
                allowing the player to shape their journey through their interactions with the world.  
                The game aims to subvert the traditional <strong>light versus darkness trope</strong>,  
                presenting a morally complex world where neither force is inherently good or evil.  
            </p>

            <p>
                By blending strategic stealth gameplay with a compelling narrative,  
                <strong>The Curse of Erephos</strong> seeks to offer a unique experience that challenges both the player's skills  
                and their perception of power, justice, and sacrifice.
            </p>
        </section>

        <div className="section-divider"></div>

            {/* Tools Used */}
            <section>
                <h2>Tools Used</h2>
                <ul style={{textAlign: "left"}}>
                    <li><strong>Game Engine:</strong> Unity</li>
                    <li><strong>3D Modeling & Animation:</strong> Mixamo, potentially Blender</li>
                    <li><strong>UI Components:</strong>GIMP 3</li>
                    <li><strong>AI Integration for Enemies:</strong> Unity ML-Agents</li>
                </ul>
            </section>

            <div className="section-divider"></div>

            {/* Game Mechanics */}
            <section>
                <h2>Game Mechanics</h2>
                <ul style={{textAlign: "left"}}>
                    <li><strong>Character Arc(s):</strong> The protagonist evolves based on choices—either embracing vengeance or seeking redemption.</li>
                    <li><strong>Game World:</strong> The mystical island of Erephos, featuring ancient ruins, Solmara settlements, and hidden sanctuaries.</li>
                    <li><strong>Stealth & Abilities:</strong> Players navigate patrols, avoid detection, and use shadow-based powers such as teleportation and disguise.</li>
                    <li><strong>Task Modality:</strong> Open-ended objectives allow missions to be completed in multiple ways, from confrontation to pure stealth.</li>
                    <li><strong>Level Design:</strong> Semi-open world with interconnected areas encouraging exploration and lore discovery.</li>
                </ul>
            </section>

            <div className="section-divider"></div>

            {/* Current Implementations */}
            <section>
            <h2>Summary of Implementations</h2>

            <p>
                My primary focus so far has been on implementing the core gameplay mechanics  
                to ensure a cohesive and functional game. Instead of building out a full world first,  
                I prioritized developing the essential systems that will define the player experience.  
                Now that these mechanics are in place, though still needing refinement, I plan to shift my focus  
                towards integrating them into a playable world that brings the game to life.
            </p>

            <p>
                Moving forward, my goal is to merge these mechanics into a structured demo level,  
                ensuring they work together seamlessly. This next phase will involve refining mechanics,  
                optimizing interactions between systems, and expanding the game world to provide  
                a compelling environment for the player to explore.
            </p>

            <h3>Current Implementations</h3>
                <p>
                    Character animations were integrated using <strong>Mixamo</strong>. 
                </p>
                <p>
                    <strong>NPC AI patrols</strong> function using NavMesh and waypoints, dynamically switching to a chase behavior when the player is nearby.
                </p>
                <p>
                    <strong>Third person camera & character controller</strong> have been developed but more updates for the camera are planned including camera collision.
                </p>
                <p>
                    <strong>Light & Shadow mechanics</strong> allow the player to visually transition between a hidden state (black colored model) and visible states that are weaker.
                </p>
                <p>
                    <strong>Telportation system</strong> integrates particle effects and a coroutine for a delayed teleportaiton effect.
                </p>
            </section>

            <div className="section-divider"></div>

            {/* Core Features Detailed */}
            <section>
                <section>
                    <h2>NPC Patrol System</h2>
                    
                    <p>
                        The NPCs in <strong>The Curse of Erephos</strong> navigate the environment using a waypoint-based patrol system. 
                        Each NPC follows a designated path using <strong>Unity's NavMesh system</strong>, ensuring smooth movement across the map. 
                        However, they are not simply passive wanderers—when a player enters their detection radius, they switch to a <strong>chase state</strong>.
                    </p>

                    <p>
                        The NPC periodically checks for the player's presence using <code>Physics.OverlapSphere()</code>. 
                        If the player is detected, the NPC abandons its patrol and pursues them. 
                        If the player successfully escapes, the NPC disengages and returns to the nearest waypoint to resume its patrol.
                    </p>

                    <h3>Implementation</h3>

                    <p>
                        The patrol behavior is controlled by a <strong>NavMeshAgent</strong>, which handles movement between waypoints.
                        The system also ensures that NPCs dynamically switch between <strong>patrolling, chasing, and returning to patrol</strong>.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
                {`void Start()
{
    agent = GetComponent<NavMeshAgent>();
    GoToNextWaypoint();
}

void Update()
{
    // Check for player, if found then chase
    Collider[] hitColliders = Physics.OverlapSphere(transform.position, sightRange, playerLayer);
    if (hitColliders.Length > 0)
    {
        chasing = true;
        target = hitColliders[0].transform;
        agent.SetDestination(target.position);
    }
    else if (chasing)
    {
        if (agent.remainingDistance < 0.5f)
        {
            chasing = false;
            GoToNextWaypoint();
        }
    }
    else if (!agent.pathPending && agent.remainingDistance < 1.0f)
    {
        GoToNextWaypoint();
    }
}`}
                    </SyntaxHighlighter>

                    <h3>Chasing the Player</h3>
                    <p>
                        The NPC detects the player using a <strong>sphere-shaped proximity check</strong>. 
                        If the player is within range, the NPC sets its destination to the player's position, 
                        dynamically updating the path as the player moves.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
                {`Collider[] hitColliders = Physics.OverlapSphere(transform.position, sightRange, playerLayer);
if (hitColliders.Length > 0)
{
    chasing = true;
    target = hitColliders[0].transform;
    agent.SetDestination(target.position);
}`}
                    </SyntaxHighlighter>

                    <h3>Returning to Patrol</h3>
                    <p>
                        If the player escapes the detection range, the NPC switches back to patrol mode. 
                        Instead of returning to the first waypoint, it identifies the nearest waypoint and continues from there.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
                {`if (chasing && agent.remainingDistance < 0.5f)
{
    chasing = false;
    GoToNextWaypoint();
}`}
                    </SyntaxHighlighter>
                    <br/>
                    <iframe 
                        src="https://drive.google.com/file/d/1yCUvq9FkWvHm5YGhJqrg6zM5UxmRzJi4/preview"
                        width="100%" 
                        height="400"
                        allow="autoplay">
                    </iframe>
                    <figcaption><strong>Figure 1:</strong> Demonstration of the NPC patrol and chase system.</figcaption>
                    

                </section>

                <div className="section-divider"></div>

                <section>
                    <h2>Character Animations Workflow</h2>

                    <p>
                        The animations in <strong>The Curse of Erephos</strong> are integrated using <strong>Mixamo</strong>. 
                        Mixamo provides a variety of pre-rigged character models and animations, 
                        allowing for quick prototyping and implementation.
                    </p>

                    <h3>Workflow Overview</h3>
                    <p>
                        The process begins with selecting a <strong>character model</strong> and downloading the necessary animations.
                        Once the files are obtained, they are imported into <strong>Unity</strong>, where both the model and animations must be configured properly. 
                        Below is a step-by-step breakdown of the workflow:
                    </p>

                    <ol style={{ textAlign: "left" }}>
                        <li>Download a <strong>character model</strong> from Mixamo.</li>
                        <li>Select and download <strong>animations</strong> that match the model (idle, walk, run).</li>
                        <li>Import the <strong>model and animations</strong> into Unity.</li>
                        <li>Extract <strong>materials and textures</strong> to properly apply them to the model.</li>
                        <li>Add the model to the scene and assign it an <strong>Animator Component</strong>.</li>
                        <li>Create an <strong>Animator Controller</strong> and assign the animations.</li>
                        <li>Set up <strong>transitions</strong> between animations (idle to walk to run).</li>
                        <li>Connect animation states to <strong>player input</strong> to trigger movement.</li>
                    </ol>

                    <h3>Importing Models and Animations</h3>
                    <p>
                        Once the <strong>character model</strong> is imported into Unity, its <strong>materials and textures</strong> need to be extracted and applied correctly. 
                        The animations are then integrated through the <strong>Animator Component</strong> and controlled via an <strong>Animator Controller</strong>.
                    </p>

                    <figure>
                        <img src="/images/charmodel.png" alt="Selecting a character model in Mixamo" className="full-width-img"/>
                        <figcaption><strong>Figure 2:</strong> Selecting a character model in Mixamo.</figcaption>
                    </figure>

                    <figure>
                        <img src="/images/animationonly.png" alt="Choosing an animation in Mixamo" className="full-width-img"/>
                        <figcaption><strong>Figure 3:</strong> Choosing and downloading animations in Mixamo.</figcaption>
                    </figure>

                    <figure>
                        <img src="/images/importmodel.png" alt="Importing models and animations into Unity" className="half-size-img"/>
                        <figcaption><strong>Figure 4:</strong> Importing the downloaded character and animations into Unity.</figcaption>
                    </figure>

                    <figure>
                        <img src="/images/animController.png" alt="Setting up an Animator Controller in Unity" className="full-width-img"/>
                        <figcaption><strong>Figure 5:</strong> Setting up an Animator Controller in Unity to manage animations.</figcaption>
                    </figure>
                    <h3>Putting it all Together</h3>
                    <p>
                        This character model can now demonstrate a salute animation!!
                    </p>
                    <iframe 
                        src="https://drive.google.com/file/d/16YZ9LV0bDgDKJOMqqPi1DX88fN1YjhLZ/preview"
                        width="100%" 
                        height="400"
                        allow="autoplay">
                    </iframe>
                    <figcaption><strong>Figure 6:</strong> Video demonstration of importing and setting up animations in Unity.</figcaption>
                    <br></br>

                    <h3>Animation Transitions and Player Input</h3>
                    <p>
                        The <strong>Animator Controller</strong> determines which animations play based on player input.
                        This character demonstration has three main states: <strong>idle, walk, and run</strong>.
                    </p>

                    <ul style={{ textAlign: "left" }}>
                        <li><strong>Idle:</strong> Default animation when no input is given.</li>
                        <li><strong>Walk:</strong> Plays when the player moves normally.</li>
                        <li><strong>Run:</strong> Triggers when the player holds the sprint key (Shift).</li>
                    </ul>

                    <p>
                        The transitions between these animations are handled through <strong>parameters in the Animator Controller</strong>, 
                        which dynamically switch based on the player's movement. The following video demonstrates how these animations can dynamically change based on player input.
                    </p>
                    <iframe 
                        src="https://drive.google.com/file/d/1z2WdZZNCHwPtXwOmZjmSHgs81cqRjmt3/preview" 
                        width="100%" 
                        height="400"
                        allow="autoplay">
                    </iframe>
                    <figcaption><strong>Figure 7:</strong> Demonstration of animation transitions based on player input.</figcaption>

                </section>

                <div className="section-divider"></div>
                
                <section>
                    <h2>Player Input and Camera Control</h2>

                    <p>
                        The player controller and third-person camera are separate but interconnected systems.  
                        The player’s movement is relative to the <strong>camera’s orientation</strong> rather than the world space.  
                        This means that pressing forward moves the player in the direction the camera is facing. 
                    </p>

                    <p>
                        The camera is tied to the player, but it can freely rotate around them without affecting movement.  
                        This allows the player to adjust their view dynamically while maintaining control over movement.
                    </p>

                    <p>
                        I initially struggled with getting the camera to behave the way I wanted.  
                        I used ChatGPT to refine the camera system,  
                        and while it works much better now, I still plan to modify it further.
                    </p>

                    <h3>Character Movement</h3>

                    <p>
                        The character moves using Unity's <strong>Rigidbody physics</strong>, allowing for smooth motion and natural rotation.  
                        Movement input is processed every frame, and the player's orientation is adjusted to match the direction of movement.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
{`private void Update()
{
    // Get movement input
    float moveX = Input.GetAxisRaw("Horizontal");
    float moveZ = Input.GetAxisRaw("Vertical");

    // Calculate move direction relative to the camera
    Vector3 move = cameraTransform.forward * moveZ + cameraTransform.right * moveX;
    move.y = 0f;
    moveDirection = move.normalized;

    // Handle rotation only when moving
    if (moveDirection.magnitude >= 0.1f)
    {
        Quaternion targetRotation = Quaternion.LookRotation(moveDirection);
        transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, rotationSpeed * Time.deltaTime);
    }
}`}
                    </SyntaxHighlighter>

                    <p>
                        Movement is calculated relative to the <strong>camera’s position</strong>, ensuring that movement always aligns with the camera’s view.  
                        The character will rotate smoothly towards the movement direction using <strong>Quaternion Slerp</strong> for natural transitions.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
{`private void FixedUpdate()
{
    // Apply movement
    rb.MovePosition(rb.position + moveDirection * moveSpeed * Time.fixedDeltaTime);
}`}
                    </SyntaxHighlighter>

                    <p>
                        When the character moves I used <strong>FixedUpdate</strong> to maintain consistent physics-based motion.  
                        The <code>MovePosition</code> method ensures smooth movement without directly modifying the transform.
                    </p>

                    <h3>Camera Control</h3>

                    <p>
                        The third-person camera allows <strong>free movement around the player</strong>,  
                        controlled by the mouse while maintaining a set distance and height from the character.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
{`void LateUpdate()
{
    if (target == null) return;

    // Mouse input for rotation
    float mouseX = Input.GetAxis("Mouse X") * rotationSpeed;
    float mouseY = Input.GetAxis("Mouse Y") * rotationSpeed;

    // Update yaw & pitch
    yaw += mouseX;
    pitch -= mouseY;
    pitch = Mathf.Clamp(pitch, pitchMin, pitchMax);

    // Calculate rotation based on yaw & pitch
    Quaternion rotation = Quaternion.Euler(pitch, yaw, 0);

    // Camera offset calculation
    Vector3 offset = rotation * new Vector3(0, height, -distance); 
    Vector3 sideOffsetVector = target.right * sideOffset; // Offset applied to target's right side

    // Cam position
    transform.position = target.position + offset + sideOffsetVector;

    // Adjust LookAt Target to Offset the View Angle
    Vector3 lookAtTarget = target.position + Vector3.up * 1.5f + sideOffsetVector * 0.5f;
    transform.LookAt(lookAtTarget);
}`}
                    </SyntaxHighlighter>

                    <p>
                        The camera follows a <strong>yaw and pitch system</strong>, allowing full control over horizontal and vertical angles.  
                        The mouse movement determines the camera's rotation, with pitch clamped to prevent extreme angles.
                    </p>

                    <p>
                        The camera maintains a <strong>fixed offset</strong> behind and slightly to the side of the player.  
                        This ensures a clear view while keeping the character within the frame.
                    </p>

                    <p>
                        Although the current system works well, I still want to make further refinements.  
                        I plan to adjust the camera's movement behavior to make it feel smoother and more responsive.  
                        I may also experiment with different camera angles and offsets to improve player visibility and control.
                    </p>

                    <iframe 
                        src="https://drive.google.com/file/d/1RI1s4K-nA8ID8sFUzTOzgF_X47l08lTx/preview"
                        width="100%" 
                        height="400"
                        allow="autoplay">
                    </iframe>
                    
                    <figcaption><strong>Figure 8:</strong> Player movement and camera control.</figcaption>

                </section>

                <div className="section-divider"></div>

                <section>
                    <h2>Light & Shadow Detection System</h2>

                    <p>
                        One of the core mechanics in <strong>The Curse of Erephos</strong> is the interaction between light and darkness.  
                        When the player is in shadows, their model turns completely black, visually blending into the darkness.  
                        If they step into the light, their original model color is restored.  
                        This mechanic is crucial to stealth gameplay, allowing the player to avoid detection by staying in the shadows.
                    </p>

                    <p>
                        The system works by using <strong>raycasting</strong> to determine if the player is exposed to light.  
                        Empty game objects are placed at the player's head and feet,  
                        and each of these points casts a ray toward the <strong>directional light source</strong>.  
                        If a ray does not reach the light due to an obstruction, such as the rays hitting a wall in between the player and the light source,
                         the player is in darkness.  
                        If one of the rays reaches the light, then the player is considered exposed.
                    </p>
                   

                    <p>
                        To handle <strong>non-directional lights</strong> (such as lamps and torches),  
                        a second approach is used: checking for <strong>light sources within range</strong> of the player.  
                        If a nearby light is detected and there are no obstacles blocking it, the player is considered illuminated.  
                    </p>

                    <h3>Implementation</h3>

                    <p>
                        The lighting detection system dynamically checks both <strong>directional and non-directional lights</strong>  
                        and smoothly transitions the player's material color based on the results.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
{`private void Update()
{
    CheckLighting();

    // Smoothly transition color
    skinnedMeshRenderer.material.color = Color.Lerp(skinnedMeshRenderer.material.color, targetColor, transitionSpeed * Time.deltaTime);
}`}
                    </SyntaxHighlighter>

                    <p>
                        The player's color transitions gradually instead of changing instantly,  
                        making the shift between light and shadow more visually appealing.
                    </p>

                    <h3>Detecting Directional Light</h3>

                    <p>
                        The game checks if the player is exposed to <strong>directional light</strong>  
                        by casting rays from their <strong>head and feet</strong> toward the light source.
                        If any of these rays are unobstructed, the player is considered in the light.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
{`private bool CheckDirectionalLight(Transform checkPoint)
{
    Vector3 lightDirection = -directionalLight.transform.forward;
    return !Physics.Raycast(checkPoint.position, lightDirection, lightCheckDistance);
}`}
                    </SyntaxHighlighter>

                    <p>
                        If the raycast does not hit an obstacle, the player is exposed.  
                        If the ray collides with an object before reaching the light, the player remains in shadow.
                    </p>

                    <h3>Handling Non-Directional Light</h3>

                    <p>
                        Non-directional lights (such as lamps, torches, or glowing objects) require a different approach.  
                        The system scans for <strong>all active lights</strong> in the scene,  
                        checking if any are within a certain <strong>radius</strong> of the player's <strong>head or feet</strong>.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
{`private bool CheckDynamicLights(Transform transform)
{
    Light[] allLights = FindObjectsOfType<Light>();
    foreach (Light light in allLights)
    {
        if (light.type != LightType.Directional && Vector3.Distance(lightCheckPointHead.position, light.transform.position) <= dynamicLightCheckRadius)
        {
            Vector3 directionToLight = (light.transform.position - lightCheckPointHead.position).normalized;
            float distanceToLight = Vector3.Distance(lightCheckPointHead.position, light.transform.position);

            // Raycast towards the dynamic light source
            if (!Physics.Raycast(lightCheckPointHead.position, directionToLight, distanceToLight))
            {
                return true;
            }
        }
    }
    return false;
}`}
                    </SyntaxHighlighter>

                    <p>
                        If a nearby <strong>non-directional light</strong> is detected and no obstacles block the path,  
                        the player is considered illuminated. Otherwise, they remain in darkness.
                    </p>

                    <h3>Debugging & Visualization</h3>

                    <p>
                        To assist with debugging, the system uses <strong>Gizmos</strong> to visualize detection zones in the Unity Editor.  
                        The detection points at the <strong>head and feet</strong> are displayed as yellow spheres,  
                        and raycast paths toward the <strong>directional light</strong> are drawn as lines.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
{`private void OnDrawGizmosSelected()
{
    if (lightCheckPointHead == null || lightCheckPointFeet == null) return;

    Gizmos.color = Color.yellow;
    Gizmos.DrawWireSphere(lightCheckPointHead.position, dynamicLightCheckRadius);
    Gizmos.DrawWireSphere(lightCheckPointFeet.position, dynamicLightCheckRadius);

    if (directionalLight != null)
    {
        Vector3 lightDirection = -directionalLight.transform.forward;
        Gizmos.DrawLine(lightCheckPointHead.position, lightCheckPointHead.position + lightDirection * lightCheckDistance);
        Gizmos.DrawLine(lightCheckPointFeet.position, lightCheckPointFeet.position + lightDirection * lightCheckDistance);
    }
}`}
                    </SyntaxHighlighter>
                    <br/>
                    <p>
                        One issue I ran into with this system is that intially, I was only checking with rays from the top of the player model. 
                        This became an issue. There were situations where half the player model was in light, but still triggered the script for the model to turn dark. 
                        See the figure 9 below for a demonstration.
                    </p>

                    <iframe 
                        src="https://drive.google.com/file/d/1iT9Shro3t9b0X3tuzHSE7K_XLYBPikvE/preview"
                        width="100%" 
                        height="400"
                        allow="autoplay">
                    </iframe>
                    <figcaption><strong>Figure 9:</strong> Demonstration of the player transitioning between light and shadow with only the head raycast.</figcaption>
                    <br></br>


                    <p>
                        The next video demonstrates how the basic shadow effect with <strong>two rays</strong> being cast from the player model should operate. 
                        This I think is the best approach I could come up with, and I think it works well.
                    </p>

                    

                    <iframe 
                        src="https://drive.google.com/file/d/1oAStUuTHTutYdOto19TJTy0istHX4XO-/preview" 
                        width="100%" 
                        height="400"
                        allow="autoplay">
                    </iframe>
                    <figcaption><strong>Figure 10:</strong> Demonstration of the player transitioning between light and shadow with both head and feet raycast. This ensures the entire model is in darkness before changing the model.</figcaption>
                    <br></br>

                    <p>
                        Lastly, this video demonstrates the detection for lights in proximity of the player. Even if the player isn't exposed to the scene directional light 
                        there needs to be detections for lights in proximity such as torches.
                    </p>

                    <iframe 
                        src="https://drive.google.com/file/d/1pOvKQzY-cwK7UFvlm8GeEMIi_4pkyDsQ/preview" 
                        width="100%" 
                        height="400"
                        allow="autoplay">
                    </iframe>
                    <figcaption><strong>Figure 11:</strong> Player interacting with proximity light sources in the environment.</figcaption>
                    
                    <h3>Shadow Empowerment & Ability System</h3>
                    <p>
                    This light and shadow system will serve as more than just a stealth mechanic, it will act as the foundation for the player's power system. 
                    In darkness, the player will be stealthier and physically stronger, making shadows not just a place to hide, but a source of energy. 
                    The ability to use special powers will be tied to the player's enshrouded state, meaning abilities can only be cast while in darkness. 
                    To balance this, I plan to implement a cost system that regulates power usage, ensuring that players must strategically navigate between light and shadow.
                    This will add another layer of depth to both movement and combat, reinforcing the importance of staying unseen. 
                    </p>

                </section>


                <div className="section-divider"></div>

                <section>
                    <h2>Teleportation System</h2>

                    <p>
                        The teleportation mechanic is designed to allow the player to navigate the environment stealthily.  
                        It serves as a tool to bypass obstacles or cross areas that would otherwise expose the player to light.  
                        For example, if a well-lit corridor is blocking the path, the player can teleport to a shadowed area on the other side,  
                        avoiding detection and maintaining their stealth.
                    </p>

                    <p>
                        The system works by casting a <strong>ray</strong> from the reticle’s position within a certain range.  
                        If the ray hits a valid teleport location, the player can instantly move there.  
                        While teleportation is already functional, I plan to implement additional mechanics to ensure that  
                        the player can only teleport into shadows. I also need to restrict teleportation  
                        based on the player’s current <strong>shadow empowerment level</strong>, ensuring that teleporting  
                        remains a limited resource rather than an infinite ability.
                    </p>

                    <h3>Implementation</h3>

                    <p>
                        The teleportation system is activated when the player presses the <strong>E key</strong>,  
                        and it has a built-in cooldown to prevent spamming.  
                        The script checks the position of the reticle and initiates teleportation.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
{`void Update()
{
    if (Input.GetKeyDown(KeyCode.E) && Time.time > lastTeleportTime + teleportCooldown)
    {
        Vector3 teleportPosition = reticleScript.GetReticleWorldPos();
        
        if (teleportPosition != Vector3.zero) 
        {
            StartCoroutine(TeleportWithParticles(teleportPosition));
            lastTeleportTime = Time.time;
        }
    }
}`}
                    </SyntaxHighlighter>

                    <p>
                        The <strong>reticle</strong> determines the teleport location, ensuring that the player  
                        only moves to a valid surface.
                    </p>

                    <h3>Using Coroutines for Teleportation Delay</h3>

                    <p>
                        Instead of making teleportation happen instantly, I implemented a slight delay  
                        using a coroutine. This makes the teleport feel more deliberate rather than instant movement.  
                        The delay also provides a window for visual effects to trigger.
                    </p>

                    <SyntaxHighlighter language="csharp" style={dracula}>
{`IEnumerator TeleportWithParticles(Vector3 newPosition)
{
    // Spawn particles at starting position
    if (teleportEffect)
    {
        Vector3 pos = new Vector3(transform.position.x, transform.position.y+1f, transform.position.z);
        ParticleSystem effect = Instantiate(teleportEffect, pos, Quaternion.identity);
        Destroy(effect.gameObject, 1f); // Destroy particles if lingering
    }

    yield return new WaitForSeconds(0.4f); // Delay before teleport

    // Teleport player to look position
    transform.position = newPosition;

    // Spawn particles at new position
    if (teleportEffect)
    {
        newPosition.y += 1f;
        ParticleSystem effect = Instantiate(teleportEffect, newPosition, Quaternion.identity);
        Destroy(effect.gameObject, 1f); // Destroy particles if lingering
    }
}`}
                    </SyntaxHighlighter>

                    <p>
                        This coroutine handles the teleportation process by adding a <strong>0.4-second delay </strong>  
                        before moving the player. This delay helps the transition feel more fluid  
                        and provides time for particle effects to animate at both the start and ending locations.
                    </p>

                    <iframe 
                        src="https://drive.google.com/file/d/1-HBnwb0kjhCwfRTEx4dBXHFnyo303Gz-/preview" 
                        width="100%" 
                        height="400"
                        allow="autoplay">
                    </iframe>
                    <figcaption><strong>Figure 12:</strong> Demonstration of the teleportation system.</figcaption>

                    <h3>Planned Improvements</h3>

                    <p>
                        While teleportation is functional, there are some changes I need to make so it feels more balanced and immersive:
                    </p>

                    <ul style={{textAlign: "left"}}>
                        <li>Implementing a <strong>shadow check</strong> to ensure the player can only teleport into darkness.</li>
                        <li>Restricting teleportation based on the player’s <strong>shadow empowerment level</strong>.</li>
                        <li>Adding an additional effect when teleportation is not allowed, such as a visual distortion or sound cue.</li>
                    </ul>

                    <h3>Improving the Particle Effects</h3>

                    <p>
                        Right now, the particle effects for teleportation are functional but not very fleshed out.  
                        They provide a basic visual cue, but they don’t fully enhance the feeling of movement or the  
                        supernatural aspect of the teleportation mechanic. I want to improve this in several ways:
                    </p>

                    <ul style={{textAlign: "left"}}>
                        <li>Making the particles feel more dynamic, with <strong>trailing effects</strong> that give a sense of motion.</li>
                        <li>Adding a <strong>dissolve or distortion effect</strong> when the player disappears and reappears.</li>
                        <li>Experimenting with different colors or <strong>shadowy wisps</strong> that briefly remain after teleporting.</li>
                    </ul>

                    <p>
                        These changes will help reinforce the supernatural feel of teleportation  
                        and make it visually satisfying to use.
                    </p>

                    

                </section>


                <div className="section-divider"></div>
            </section>

            

            {/* Game References */}
            <section>
                <h2>References</h2>

                <ul style={{textAlign: "left"}}>
                    <li><a href="https://learn.unity.com/tutorial/controlling-unity-camera-behaviour" target="_blank">Controlling Unity Camera Behavior - Unity Learn</a></li>
                    <li><a href="https://learn.unity.com/course/introduction-to-3d-animation-systems" target="_blank">Introduction to 3D Animation Systems - Unity Learn</a></li>
                    <li><a href="https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Physics.Raycast.html" target="_blank">Unity Documentation: Physics.Raycast</a></li>
                    <li><a href="https://www.youtube.com/watch?v=NeuxiCn_zR8&t=185s&ab_channel=SebastianGraves" target="_blank">Sebastian Graves - NPC AI Patrol Tutorial (YouTube)</a></li>

                    
                    <li><strong>Dishonored</strong> - Arkane Studios, 2012. Published by Bethesda Softworks.</li>
                    <li><strong>Aragami</strong> - Lince Works, 2016. Published by Lince Works.</li>
                    <li><strong>Sekiro: Shadows Die Twice</strong> - FromSoftware, 2019. Published by Activision.</li>

                    
                    <li><strong>ChatGPT</strong> - OpenAI. Used for code assistance, structuring documentation, and refining ideas.</li>
                </ul>
            </section>

            <div className="section-divider"></div>

            {/* Conclusion */}
            <section>
                <h2>Conclusion</h2>
                <p>
                    The development of <strong>The Curse of Erephos</strong> focuses on blending stealth gameplay, supernatural abilities, and moral dilemmas into an engaging experience.
                    Future development will expand current mechanics, and focus on expanding and building the world that the player will interact with.

                </p>
            </section>

            <footer>
                <p>© 2025 Michael Hamilton</p>
            </footer>
        </div>
    );
}

export default AdvGameProgrammingReport;
