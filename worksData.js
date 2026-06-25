// worksData.js
const projectData = {
    'project1': {
        title: 'One-Storey Pickleball Court with Mezzanine',
        status: 'Completed',
        statusClass: 'status-completed',
        images: [
            { src: 'images/FMDC Structural Perspective.png', caption: 'Geometric Perspective' },
            { src: 'images/FMDC_1.png', caption: 'Drawing File' },
            { src: 'images/FMDC_2.png', caption: 'Drawing File' },
            { src: 'images/FMDC_3.png', caption: 'Drawing File' }
        ],
        description: "Completed the structural design and detailed documentation for a one-storey pickleball facility featuring a functional mezzanine level. Due to the high-seismic demands of the region, the lateral force resisting system was engineered using a Special Concentrically Braced Frame (SCBF). Linear Static and Dynamic Response-Spectrum Analysis (RSA) were utilized to optimize the steel members and connections, ensuring the structure could withstand significant seismic energy through controlled member yielding.\n\n Bridged the gap between advanced steel modeling and on-site assembly through high-precision CAD layouts and connection detailing. Specific focus was placed on the design of the mezzanine floor and the large-span roof trusses to maintain the open-court architectural intent while meeting stringent drift requirements. The resulting documentation provided a clear roadmap for the contractor teams, ensuring that the specialized bracing and structural joints were implemented with high accuracy for a safe and cost-effective build."
    },
    'project3': {
        title: '3-Storey Residential Building with One-level Basement',
        status: 'Completed',
        statusClass: 'status-completed',
        images: [
            { src: 'images/Borreros Structural Perspective.png', caption: 'Geometric Perspective' },
            { src: 'images/Plans_Borreros.png', caption: 'Drawing File' },
            { src: 'images/Plans_Borreros2.png', caption: 'Drawing File' }
        ],
        description: "Executed comprehensive structural design and analysis for a residential building featuring a single-level basement and a distinctive U-shaped architectural configuration. Linear Static and Dynamic Response-Spectrum Analysis (RSA) were utilized to mitigate torsional effects and stress concentrations inherent in irregular plan geometries. To ensure seamless on-site execution, the gap between complex analytical modeling and final construction was bridged through high-precision CAD documentation. This process translated sophisticated seismic data into clear, constructability-focused details, providing contractor teams with a definitive roadmap for assembly.\n\nClarity in the detailing of re-entrant corners and basement retaining walls was prioritized to eliminate field errors and maintain strict alignment with the architectural intent. Following the project’s completion, a proactive site inspection was conducted to evaluate the structure’s performance after the 2025 earthquake series. This post-construction verification confirmed the total integrity of the concrete frame, proving that the meticulous coordination between analysis and detailed documentation resulted in a resilient structure free of significant seismic distress."
    },
    'project5': {
        title: 'One-Storey Residential Building with One-level Basement',
        status: 'Completed',
        statusClass: 'status-completed',
        images: [
            { src: 'images/Ayala Structural Perspective.png', caption: 'Geometric Perspective' },
            { src: 'images/Ayala Plans.png', caption: 'Drawing File' },
            { src: 'images/Ayala Plans2.png', caption: 'Drawing File' }
        ],
        description: "Led the structural design and documentation for a one-storey residential building with a distinctive U-shaped architectural configuration and one-level basement, focusing on cost-effectiveness and constructability. Employed Linear Static and Dynamic Response-Spectrum Analysis (RSA) to address seismic concerns in the region. The design balanced safety requirements with a streamlined structural system, ensuring efficient material usage and construction processes.\n\n Collaborated closely with the architectural team to integrate structural elements seamlessly into the building's aesthetic. Detailed CAD drawings were produced to guide construction, ensuring that all seismic considerations were accurately implemented. The completed project met all performance criteria and received recognition for its innovative approach to commercial structural design."
    },
    'project6': {
        title: '3-Unit Townhouse-Type Residential Building',
        status: 'Completed',
        statusClass: 'status-completed',
        images: [
            { src: 'images/Estepa Residence.jpg', caption: 'Geometric Perspective' },
            { src: 'images/Estepa Residence - plan 1.png', caption: 'Drawing File' },
            { src: 'images/Estepa Residence - plan 2.png', caption: 'Drawing File' }
        ],
        description: "3-Unit Townhouse-Type Residential Building\n\nLocated in Taguig City, Philippines, this residential townhouse development consists of two 2-storey units and one 3-storey unit designed within a compact urban setting. One of the major engineering considerations of the project was its proximity to an active fault line located less than one kilometer from the site, requiring a more detailed seismic evaluation and careful structural planning.\n\nThe structural design utilized a reinforced concrete framing system supported by a mat foundation to provide improved load distribution and foundation stability across the varying building heights. Linear Static Analysis and Dynamic Response Spectrum Analysis (RSA) were performed to evaluate the building’s structural response under seismic loading conditions and ensure compliance with code-based performance requirements.\n\nClose coordination with the architectural team was essential in integrating the structural system within the townhouse layout while maintaining constructability, functionality, and efficient material usage. Detailed CAD construction drawings and structural documentation were prepared to support accurate implementation of the structural and seismic design requirements during construction."
    },
    'project7': {
        title: 'Automotive Commercial and Service Building',
        status: 'Completed',
        statusClass: 'status-completed',
        images: [
            { src: 'images/Isuzu San Pablo Commercial.jpg', caption: 'Geometric Perspective' },
            { src: 'images/Isuzu San Pablo Plans 1.png', caption: 'Drawing File' },
            { src: 'images/Isuzu San Pablo Plans 2.png', caption: 'Drawing File' }
        ],
        description: "Automotive Commercial and Service Building\n\nLocated in San Pablo City, Philippines, this commercial and service building was designed to meet the needs of a modern automotive dealership. The project presented unique engineering challenges due to its location near an active fault line, requiring a comprehensive seismic evaluation and robust structural design.\n\nThe structural design utilized a reinforced concrete framing system supported by a mat foundation to provide improved load distribution and foundation stability across the varying building heights. Linear Static Analysis and Dynamic Response Spectrum Analysis (RSA) were performed to evaluate the building’s structural response under seismic loading conditions and ensure compliance with code-based performance requirements.\n\nClose coordination with the architectural team was essential in integrating the structural system within the building layout while maintaining constructability, functionality, and efficient material usage. Detailed CAD construction drawings and structural documentation were prepared to support accurate implementation of the structural and seismic design requirements during construction."
    },
    'project8': {
        title: 'Multi-Purpose Clubhouse and Sports Facility',
        status: 'Completed',
        statusClass: 'status-completed',
        images: [
            { src: 'images/Bacolod clubhouse.png', caption: 'Geometric Perspective' },
            { src: 'images/Bacolod clubhouse plans 1.png', caption: 'Drawing File' },
        ],
        description: "Clubhouse and Sports Facility\n\nLocated in Bacolod City, Philippines, this clubhouse and sports facility was designed to serve as a functional recreational and community space integrating sports, social, and administrative areas within a single development. The project required careful structural planning to accommodate open spaces, varying occupancy loads, and efficient circulation while maintaining overall constructability and structural performance. Detailed structural documentation and coordination were carried out to support the project’s architectural vision and ensure compliance with applicable design standards."
    },
    'project2': {
        title: '4-Storey Residential Building',
        status: 'Completed',
        statusClass: 'status-completed',
        images: [
            { src: 'images/D-House residence.png', caption: 'Perspective View' },
            { src: 'images/Plans 1.png', caption: 'Drawing File' },
            { src: 'images/Plans 2.png', caption: 'Drawing File' }
        ],
        description: "Performed comprehensive structural design and analysis for a 4-storey residential building using Linear Static and Dynamic Response-Spectrum Analysis (RSA) to ensure seismic resilience in a high-risk zone. Developed detailed structural documentation and construction drawings, ensuring all solutions maintained strict alignment with the original architectural intent.\n\n Addressed weak soil conditions by conducting a depth-bearing capacity trade-off analysis. Determined an optimal excavation depth to reach a stable strata, providing a high-bearing capacity foundation without the need for expensive deep-piling. To counter the small footprint and soil limitations, integrated Autoclaved Aerated Concrete (AAC) blocks into the design. This significantly reduced the building's dead load, allowing for more slender structural members and reduced foundation pressure."
    },
    'project4': {
        title: '2-Storey Residential Building',
        status: 'Completed',
        statusClass: 'status-completed',
        images: [
            { src: 'images/SAMOY RESIDENCE.png', caption: 'Perspective View' },
            { src: 'images/Plans_Samoy.png', caption: 'Drawing File' }
        ],
        description: "Completed the structural design and detailed documentation for a residential project, prioritizing cost-efficiency and structural simplicity. Due to the site’s proximity to an active fault line, Linear Static and Dynamic Response-Spectrum Analysis (RSA) were utilized to ensure superior seismic performance. This high-level analytical approach allowed for a design that balances strict safety requirements with a lightweight and economical structural frame.\n\n Bridged the gap between advanced seismic modeling and on-site execution through high-precision CAD layouts. These detailed drawings provided contractor teams with a clear, error-free roadmap for assembly, ensuring that critical seismic details were accurately implemented during construction. The final output successfully synchronized stringent technical standards with the original architectural intent, delivering a safe and buildable residential solution."
    }
};